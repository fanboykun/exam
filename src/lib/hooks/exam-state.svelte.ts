import { Editor, type Content } from '@tiptap/core';
export function createExam(len: number) {
	return new Exam(len);
}
export class Exam {
	// Exam metadata
	title = $state<string>('');
	description = $state<string>('');
	duration = $state<number>(60); // minutes
	passingScore = $state<number>(70); // percentage
	randomizeQuestion = $state<boolean>(false);

	questions = $state<Question[]>([]);

	constructor(len: number) {
		this.questions = Array.from({ length: len }, (_, i) => new Question(i + 1));
	}

	getQuestions() {
		return this.questions;
	}

	// Extract complete exam properties as snapshot
	extract() {
		return $state.snapshot({
			title: this.title,
			description: this.description,
			duration: this.duration,
			passingScore: this.passingScore,
			questions: this.questions.map((q) => q.extract())
		});
	}

	// Debug method to inspect the exam state
	debug() {
		return {
			title: this.title,
			description: this.description,
			duration: this.duration,
			passingScore: this.passingScore,
			questionsCount: this.questions.length,
			questions: this.questions.map((q) => q.debug())
		};
	}
}
export class Question {
	number = $state<number>(0);
	editor = $state<Editor>();
	content = $state<Content | undefined>(undefined);
	choises = $state<Choice[]>([]);
	constructor(number: number) {
		this.number = number;
		this.choises = Array.from({ length: 4 }, (_, i) => new Choice(i + 1));
	}

	// Extract complete question properties as snapshot
	extract() {
		return $state.snapshot({
			number: this.number,
			content: this.content,
			choices: this.choises.map((c) => c.extract())
		});
	}

	// Debug method to inspect the question state
	debug() {
		return {
			number: this.number,
			hasEditor: !!this.editor,
			hasContent: !!this.content,
			choicesCount: this.choises.length,
			choices: this.choises.map((c) => c.debug())
		};
	}
}

export class Choice {
	position = $state<number>(0);
	content = $state<Content>();
	editor = $state<Editor>();
	isCorrect = $state<boolean>();
	constructor(position: number) {
		this.position = position;
		this.editor = undefined!;
		this.content = undefined;
		this.isCorrect = false;
	}

	// Extract complete choice properties as snapshot
	extract() {
		return $state.snapshot({
			position: this.position,
			content: this.content,
			isCorrect: this.isCorrect
		});
	}

	// Debug method to inspect the choice state
	debug() {
		return {
			position: this.position,
			hasContent: !!this.content,
			hasEditor: !!this.editor,
			isCorrect: this.isCorrect
		};
	}
}
