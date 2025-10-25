<script lang="ts">
	import QuestionContent from './question-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import QuestionChoises from './question-choises.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { Question } from './exam-state.svelte';

	const questions = $state<Question[]>([new Question(1)]);
	let selectedIdx = $state(0);
	function addEmptyQuestion() {
		const nextNumber = questions.length + 1;
		return new Question(nextNumber);
	}
</script>

<div class="flex w-full gap-4">
	<div class="flex w-1/8 flex-col gap-2">
		<Button class="w-full" onclick={() => questions.push(addEmptyQuestion())}>Add New</Button>
		{#each questions as question, i}
			<Button
				variant={i === selectedIdx ? 'outline' : 'ghost'}
				class="w-full"
				onclick={() => {
					selectedIdx = i;
				}}
			>
				{question.number}
			</Button>
		{/each}
	</div>
	<div class="flex w-7/5 flex-col gap-4">
		{#if questions[selectedIdx] !== undefined}
			<QuestionContent bind:question={questions[selectedIdx]} />
			<Separator />
			<QuestionChoises bind:question={questions[selectedIdx]} />
		{/if}
	</div>
</div>
