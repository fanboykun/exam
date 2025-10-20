import { SvelteMap } from 'svelte/reactivity';
import { remoteSubmitHandler } from './remote-sumbit-handler.svelte';
import { createAssignment, submitAssignment } from '$lib/remotes/assignment.remote';

export type ExamHook = ReturnType<typeof createExamHook>;

type ExamWithQuestions = Entity['Exam'] & { questions: QuestionWithChoices[] };
type QuestionWithChoices = Entity['Question'] & { choises: Choice[] };
type Choice = { id: string; content: string; position: number };

export type ExamHookProps = {
	exam: ExamWithQuestions;
	assignment?: Entity['Assignment'];
};

export function createExamHook(props: ExamHookProps) {
	return new ExamHookClass(props);
}

class ExamHookClass {
	currentState = $state<'preparation' | 'progress' | 'summary' | 'result'>('preparation');

	exam: ExamWithQuestions;
	assignment = $state<Entity['Assignment']>();
	questions = $state<QuestionWithChoices[]>([]);

	answers = new SvelteMap<string, string>(); // questionId and choiceId
	currentQuestionIdx = $state(0);
	currentQuestion = $derived(this.questions[this.currentQuestionIdx]);

	timeLeft = $state(0);
	isQuestionListOpen = $state(false);
	private timerInterval?: ReturnType<typeof setInterval>;
	showTimeoutDialog = $state(false);

	createAssigmentHandler = remoteSubmitHandler({
		onSubmit: ({ cancel }) => {
			if (this.assignment) return cancel('Assignment Alreadyy Exists');
			return () => createAssignment({ examId: this.exam.id });
		},
		onSuccess: ({ data }) => {
			this.assignment = data;
			this.currentState = 'progress';
			this.initializeTimer();
		}
	});

	finishAssignmentHandler = remoteSubmitHandler({
		onSubmit: ({ cancel }) => {
			const assignmentId = this.assignment?.id;
			if (!assignmentId) return cancel('No Assignemnt');
			if (!this.answers.size) return cancel('No Answers Yet');
			const mappedAnswers = Array.from(this.answers.entries()).map(([questionId, choiseId]) => ({
				questionId,
				choiseId
			}));
			return () =>
				submitAssignment({
					assignmentId: assignmentId,
					answers: mappedAnswers,
					finishedAt: new Date()
				});
		},
		onSuccess: ({ data }) => {
			this.assignment = data.assignment;
			this.currentState = 'result';
			this.clearAnswerFromLocalStorage(this.assignment.id);
			this.destroy();
		}
	});

	constructor(props: ExamHookProps) {
		this.exam = props.exam;
		this.questions = props.exam.questions;
		this.assignment = props.assignment;
		this.initializeTimer();
	}

	private initializeTimer() {
		if (!this.exam.duration || !this.assignment?.startAt) return;

		const updateTimer = () => {
			const now = Date.now();
			const startTime = new Date(this.assignment!.startAt).getTime();
			const durationMs = this.exam.duration! * 60 * 1000;
			const endTime = startTime + durationMs;
			const remaining = Math.max(0, endTime - now);

			this.timeLeft = Math.floor(remaining / 1000);

			if (this.timeLeft === 0) {
				this.stopTimer();
				if (this.currentState === 'progress') {
					this.showTimeoutDialog = true;
					this.finishExam();
				}
			}
		};

		updateTimer();
		this.timerInterval = setInterval(updateTimer, 1000);
	}

	private stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = undefined;
		}
	}

	destroy() {
		this.stopTimer();
	}

	get formattedTimeLeft() {
		const hours = Math.floor(this.timeLeft / 3600);
		const minutes = Math.floor((this.timeLeft % 3600) / 60);
		const seconds = this.timeLeft % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	async startExam() {
		await this.createAssigmentHandler.handle();
	}

	isCurrentAnswer(choiceId: string) {
		return this.answers.get(this.currentQuestion.id) === choiceId;
	}

	isAnswered(questionId: string) {
		return this.answers.has(questionId);
	}

	canGoPrev() {
		return this.currentQuestionIdx > 0;
	}

	canGoNext() {
		const nextIdx = this.currentQuestionIdx + 1;
		return nextIdx < this.questions.length;
	}

	nextQuestion() {
		if (!this.canGoNext()) {
			this.currentState = 'summary';
			return;
		}
		this.currentQuestionIdx++;
	}

	prevQuestion() {
		if (!this.canGoPrev()) return;
		this.currentQuestionIdx--;
	}

	gotoQuestion(questionId: string) {
		const selectedIndex = this.questions.findIndex((q) => q.id === questionId);
		if (selectedIndex === -1) return;
		this.currentQuestionIdx = selectedIndex;
	}

	answerQuestion(choiceId: string) {
		this.answers.set(this.currentQuestion.id, choiceId);
		// this.nextQuestion();
	}

	canViewSummary() {
		return this.currentQuestionIdx + 1 === this.questions.length;
	}

	viewSummary() {
		this.currentState = 'summary';
	}

	async finishExam() {
		await this.finishAssignmentHandler.handle();
	}

	async retakeExam() {
		this.stopTimer();
		this.assignment = undefined;
		this.answers.clear();
		this.currentQuestionIdx = 0;
		this.currentState = 'preparation';
		this.timeLeft = 0;
	}

	handleBeforeUnload(event: BeforeUnloadEvent) {
		event.preventDefault();
		if (!this.answers.size || !this.assignment) return;
		if (this.currentState === 'result' || this.currentState === 'preparation') return;
		const ans = Object.fromEntries(this.answers.entries());
		const strans = JSON.stringify(ans);
		localStorage.setItem(this.assignment.id, strans);
	}

	checkAnswerFromLocalStorage(key: string) {
		const ans = localStorage.getItem(key);
		if (!ans) return;
		const parsed = JSON.parse(ans) as Record<string, string>;
		Object.entries(parsed ?? {}).forEach(([questionId, choiceId]) => {
			this.answers.set(questionId, choiceId);
		});
	}

	clearAnswerFromLocalStorage(key: string) {
		localStorage.removeItem(key);
	}
}
