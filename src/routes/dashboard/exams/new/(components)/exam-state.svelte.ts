import { Editor, type Content } from '@tiptap/core';

export class Question {
	number = $state<number>(0);
	editor = $state<Editor>();
	content = $state<Content | undefined>(undefined);
	choises = $state<Choice[]>([]);
	constructor(number: number) {
		this.number = number;
		this.choises = Array.from({ length: 4 }, (_, i) => new Choice(i + 1));
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
}
