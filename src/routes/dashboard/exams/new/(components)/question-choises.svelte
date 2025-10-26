<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		EdraEditor,
		EdraToolBar
		// EdraDragHandleExtended
	} from '$lib/components/edra/shadcn/index.js';
	import type { Question } from '../../../../../lib/hooks/exam-state.svelte';
	import { Switch } from '$lib/components/ui/switch';

	interface Props {
		question: Question;
	}
	let { question = $bindable() }: Props = $props();
</script>

<Card.Root class="gap-2">
	<Card.Header>
		<Card.Title>Question Choices</Card.Title>
		<Card.Description>Fill the options</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4 px-4">
		{#each question.choises as choice, i}
			{#key `${question.number}-${choice.position}`}
				<Card.Root class="gap-2 overflow-hidden py-2">
					<Card.Header class="px-2 py-1">
						<Card.Title class="flex items-center  gap-2 text-sm">
							Option {choice.position}
							<Switch bind:checked={question.choises[i].isCorrect} />
						</Card.Title>
					</Card.Header>
					<Card.Content class="grid w-fit flex-col gap-2 px-2">
						<div class="z-50 size-full w-full overflow-hidden rounded-md border border-dashed">
							{#if question.choises[i].editor && !question.choises[i].editor.isDestroyed}
								<EdraToolBar
									class="flex w-full items-center overflow-x-auto border-b border-dashed bg-secondary/50 p-0.5"
									editor={question.choises[i].editor!}
								/>
								<!-- <EdraDragHandleExtended editor={question.choises[i].editor!} /> -->
							{/if}
							<EdraEditor
								bind:editor={question.choises[i].editor}
								content={question.choises[i].content}
								class="max-h-[30rem] max-h-screen min-h-[10rem] w-full overflow-y-scroll pr-2 pl-6"
								onUpdate={() => {
									question.choises[i].content = question.choises[i].editor!.getJSON();
								}}
							/>
						</div>
					</Card.Content>
				</Card.Root>
			{/key}
		{/each}
	</Card.Content>
</Card.Root>
