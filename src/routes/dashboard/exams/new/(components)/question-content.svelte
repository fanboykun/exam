<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		EdraEditor,
		EdraToolBar,
		EdraDragHandleExtended
	} from '$lib/components/edra/shadcn/index.js';
	import type { Question } from './exam-state.svelte';

	interface Props {
		question: Question;
	}
	let { question = $bindable() }: Props = $props();
	function onUpdate() {
		question.content = question.editor?.getJSON();
	}
	$inspect(question);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Question Content</Card.Title>
	</Card.Header>
	<Card.Content class="flex flex-col gap-2">
		<div class="z-50 size-full w-auto rounded-md border border-dashed">
			{#if question.editor && !question.editor.isDestroyed}
				<EdraToolBar
					class="flex w-full items-center overflow-x-auto border-b border-dashed bg-secondary/50 p-0.5"
					editor={question.editor}
				/>
				<EdraDragHandleExtended editor={question.editor} />
			{/if}
			<EdraEditor
				bind:editor={question.editor}
				content={question.content}
				class="max-h-[30rem] max-h-screen min-h-[10rem] w-full overflow-y-scroll pr-2 pl-6"
				{onUpdate}
			/>
		</div>
	</Card.Content>
</Card.Root>
