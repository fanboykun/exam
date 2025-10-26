<script lang="ts">
	import QuestionContent from './question-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import QuestionChoises from './question-choises.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Question } from '../../../../../lib/hooks/exam-state.svelte';
	import * as Card from '$lib/components/ui/card';
	// import * as Item from '$lib/components/ui/item';
	interface Props {
		questions: Question[];
	}
	let { questions = $bindable() }: Props = $props();
	let selectedIdx = $state(0);
	function addEmptyQuestion() {
		const nextNumber = questions.length + 1;
		return new Question(nextNumber);
	}
</script>

<div class="relative flex w-full flex-col gap-4 lg:flex-row">
	<div class="sticky top-1 flex max-h-svh w-full flex-col gap-2 overflow-y-auto lg:w-2/8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Questions</Card.Title>
				<Card.Description>3 Questions</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each questions as question, index (question.choises)}
					<div
						class="group relative rounded-lg border transition-all {selectedIdx === index
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50'}"
					>
						<button
							class="w-full px-3 py-2 text-left"
							onclick={() => (selectedIdx = index)}
							aria-label="Select question"
						>
							<div class="flex items-start gap-2">
								<span
									class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold {selectedIdx ===
									index
										? 'bg-primary text-primary-foreground'
										: 'bg-secondary text-foreground'}"
								>
									{index + 1}
								</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-foreground">
										Number {index + 1}
									</p>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{question.choises.length} choices
									</p>
								</div>
							</div>
						</button>

						<!-- Delete Button -->
						<button
							class="absolute top-2 right-2 hidden rounded p-1 text-muted-foreground group-hover:block hover:bg-destructive/10 hover:text-destructive"
							title="Delete question"
							aria-label="Delete question"
							onclick={() => {
								if (questions.length > 1) {
									questions.splice(index, 1);
									if (selectedIdx === index) {
										selectedIdx = 0;
									}
								}
							}}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</Card.Content>
			<Card.Footer>
				<Button
					onclick={() => questions.push(addEmptyQuestion())}
					class="border-dahsed w-full border"
					variant="outline">Add New</Button
				>
			</Card.Footer>
		</Card.Root>
	</div>
	<div class="flex w-full flex-col gap-4 lg:w-6/8">
		{#if questions[selectedIdx] !== undefined}
			{#key selectedIdx}
				<QuestionContent bind:question={questions[selectedIdx]} />
				<Separator />
				<QuestionChoises bind:question={questions[selectedIdx]} />
			{/key}
		{/if}
	</div>
</div>
