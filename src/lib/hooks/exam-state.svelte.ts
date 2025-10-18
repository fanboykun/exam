import { SvelteMap } from 'svelte/reactivity';
import { remoteSubmitHandler } from './remote-sumbit-handler.svelte';
import { createAssignment, submitAssignment } from '$lib/remotes/assignment.remote';

type ExamWithQuestionsAndChoise = Entity['Exam'] & {
	questions: QuestionWitnChoise[];
};

export type QuestionWitnChoise = Entity['Question'] & {
	choises: Omit<Entity['Choise'], 'isCorrect'>[];
};

export type ExamStateProps = {
	exam: ExamWithQuestionsAndChoise;
};

export function createExamState(props: ExamStateProps) {
	return new ExamState(props);
}

class ExamState {
	currentState = $state<'preparation' | 'process' | 'summary' | 'result'>('preparation');
	exam: Entity['Exam'];
	questions = $state<QuestionWitnChoise[]>([]);
	private currentQuestionIndex = $state<number>(0);
	currentQuestion = $derived(this.questions[this.currentQuestionIndex]);
	answers = new SvelteMap<string, string>(); //questionId and choiseId
	assignment = $state<Entity['Assignment'] | null>(null);
	correctAnswers = $state(0);
	timeTaken = $state(0);
	timeLeft = $state(0);
	isTimeExceeded = $state(false);
	private interval: NodeJS.Timeout | undefined = undefined;

	readonly sendAssignmentHandler = remoteSubmitHandler({
		onSubmit: ({ cancel }) => {
			if (!this.exam) return cancel('Exam not found');
			if (this.assignment) return cancel('Assignment already exists');
			return () => createAssignment({ examId: this.exam.id });
		},
		onSuccess: ({ data }) => {
			this.assignment = data;
		}
	});

	readonly submitAssignmentHandler = remoteSubmitHandler({
		onSubmit: ({ cancel }) => {
			const assignmentId = this.assignment?.id;
			if (!assignmentId) return cancel('Assignment not found');
			const mappedAnsers = Array.from(this.answers.entries()).map(([questionId, choiseId]) => ({
				questionId,
				choiseId
			}));
			return () => submitAssignment({ assignmentId, answers: mappedAnsers });
		},
		onSuccess: ({ data }) => {
			this.correctAnswers = data.correctAnswers;
			this.timeTaken = data.timeTaken;
		}
	});

	constructor(props: ExamStateProps) {
		this.exam = props.exam;
		this.questions = props.exam.questions;
		this.timeLeft = props.exam.duration ?? 0 * 60;
	}

	async startExam() {
		await this.sendAssignmentHandler.handle();
		this.currentState = 'process';
		this.runTimer();
		this.wathForTimeExceeded();
	}

	private runTimer() {
		$effect(() => {
			if (!this.exam.duration) return;
			if (this.currentState !== 'process') return;
			this.interval = setInterval(() => {
				this.timeLeft -= 1;
			}, 1000);
			return () => clearInterval(this.interval);
		});
	}

	private wathForTimeExceeded() {
		$effect(() => {
			if (!this.exam.duration) return;
			if (this.timeLeft <= 0) {
				this.showTimeExceeded();
			}
		});
	}

	async finishAssignment() {
		if (!this.assignment) return;
		await this.sendAssignmentHandler.handle();
		this.currentState = 'summary';
		clearInterval(this.interval);
	}

	showTimeExceeded() {
		this.isTimeExceeded = true;
		clearInterval(this.interval);
	}

	answerQuestion(choiseId: string) {
		this.answers.set(this.currentQuestion.id, choiseId);
	}

	isSelectedChoise(choiseId: string) {
		return this.answers.get(this.currentQuestion.id) === choiseId;
	}

	isAnswered(question: QuestionWitnChoise) {
		return this.answers.has(question.id);
	}

	gotoQuestion(questionNumber: number) {
		const nextQuestion = this.questions[questionNumber];
		if (typeof nextQuestion === 'undefined') return;
		this.currentQuestionIndex = questionNumber;
	}
	canGoToPrev() {
		return this.currentQuestionIndex > 0;
	}
	canGoToNext() {
		const nextIndex = this.currentQuestionIndex + 1;
		return nextIndex <= this.questions.length;
	}
	nextQuestion() {
		if (!this.canGoToNext()) {
			this.viewSummary();
			return;
		}
		this.gotoQuestion(this.currentQuestionIndex + 1);
	}
	prevQuestion() {
		if (!this.canGoToPrev()) return;
		this.gotoQuestion(this.currentQuestionIndex - 1);
	}
	canSubmitAssignment() {
		return this.questions.length === this.answers.size;
	}
	viewSummary() {
		this.currentState = 'summary';
	}
}
