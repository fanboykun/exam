import { remoteSubmitHandler } from './remote-sumbit-handler.svelte';
import { createAssignment, submitAssignment } from '$lib/remotes/assignment.remote';
import { SyncedCache } from './db-sync.svelte';
import { offlineSyncManager } from './offline-sync.svelte';

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

	answers: SyncedCache<string, string> | null = null; // questionId and choiceId
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
		onSuccess: async ({ data }) => {
			this.assignment = data;
			await this.initAnswersCache();
			this.currentState = 'progress';
			this.initializeTimer();
		}
	});

	finishAssignmentHandler = remoteSubmitHandler({
		onSubmit: ({ cancel, toast }) => {
			const assignmentId = this.assignment?.id;
			if (!assignmentId) return cancel('No Assignemnt');
			if (!this.answers || !this.answers.size) return cancel('No Answers Yet');

			// Warn if offline
			if (offlineSyncManager.offline) {
				toast.info('You are offline. Your submission will be sent when you reconnect.');
			}

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
		onSuccess: async ({ data }) => {
			this.assignment = data.assignment;
			this.currentState = 'result';
			if (this.answers) await this.answers.clearNamespace();
			this.destroy();
		},
		onError: () => {
			// Keep answers in cache if submission fails
			if (offlineSyncManager.offline) {
				// Toast already shown in onSubmit
			}
		}
	});

	constructor(props: ExamHookProps) {
		this.exam = props.exam;
		this.questions = props.exam.questions;
		this.assignment = props.assignment;
		this.initAnswersCache().then(() => {
			if (this.assignment) {
				this.currentState = 'progress';
			}
		});
		this.initializeTimer();
	}

	private async initAnswersCache() {
		if (!this.assignment) {
			this.answers = null;
			return;
		}
		this.answers = new SyncedCache<string, string>(`assignment-${this.assignment.id}`);
		await this.answers.loadFromIndexedDB();
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
		if (!this.answers) return false;
		return this.answers.get(this.currentQuestion.id) === choiceId;
	}

	isAnswered(questionId: string) {
		if (!this.answers) return false;
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
		if (!this.answers) return;
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
		if (this.answers) await this.answers.clearNamespace();
		this.assignment = undefined;
		await this.initAnswersCache();
		this.currentQuestionIdx = 0;
		this.currentState = 'preparation';
		this.timeLeft = 0;
	}

	handleBeforeUnload(event: BeforeUnloadEvent) {
		event.preventDefault();
		// Answers are automatically synced to IndexedDB via service worker
	}
}
