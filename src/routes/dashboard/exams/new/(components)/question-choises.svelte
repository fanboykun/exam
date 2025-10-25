<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		EdraEditor,
		EdraToolBar,
		EdraDragHandleExtended
	} from '$lib/components/edra/shadcn/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Check } from '@lucide/svelte';
	import { Label } from '$lib/components/ui/label';
	import type { Choice, Question } from './exam-state.svelte';
	import { Switch } from '$lib/components/ui/switch';

	interface Props {
		question: Question;
	}
	let { question = $bindable() }: Props = $props();
	let selectedChoiceIdx = $state(0);
	function onUpdate(choice: Choice) {
		if (choice) {
			choice.content = choice.editor?.getJSON();
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Question Choices</Card.Title>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		{#each question.choises as choice, i}
			<Collapsible.Root open={selectedChoiceIdx === i} class="flex flex-col gap-2">
				<div class="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-2">
					<Collapsible.Trigger
						class={buttonVariants({
							variant: 'secondary',
							class: 'flex flex-grow items-center justify-start'
						})}
						onclick={() => {
							selectedChoiceIdx = selectedChoiceIdx === i ? -1 : i;
						}}
					>
						Option {choice.position}
						{#if choice.isCorrect}
							<Check />
						{/if}
					</Collapsible.Trigger>
					<div class="flex items-center space-x-2">
						<Switch bind:checked={choice.isCorrect} id={choice.position.toString()} />
						<Label for={choice.position.toString()}>Correct Answer</Label>
					</div>
				</div>
				<Collapsible.Content class="w-full overflow-hidden">
					{#key `${question.number}-${choice.position}`}
						<div class="z-50 size-full w-auto rounded-md border border-dashed">
							{#if choice.editor && !choice.editor.isDestroyed}
								<EdraToolBar
									class="flex w-full items-center overflow-x-auto border-b border-dashed bg-secondary/50 p-0.5"
									editor={choice.editor}
								/>
								<EdraDragHandleExtended editor={choice.editor} />
							{/if}
							<EdraEditor
								bind:editor={choice.editor}
								content={choice.content}
								class="max-h-[30rem] max-h-screen min-h-[10rem] w-full overflow-y-scroll pr-2 pl-6"
								onUpdate={() => onUpdate(choice)}
							/>
						</div>
					{/key}
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</Card.Content>
</Card.Root>
