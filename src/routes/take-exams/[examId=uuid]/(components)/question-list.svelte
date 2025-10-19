<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { ExamHook } from '$lib/hooks/exam-hook.svelte';
	interface Props {
		examHook: ExamHook;
	}
	let { examHook }: Props = $props();
</script>

<div class="space-2 flex flex-wrap gap-2">
	{#each examHook.questions as question}
		{@const isCurrentQuestion = examHook.currentQuestion.id === question.id}
		{@const isAnswered = examHook.isAnswered(question.id)}
		<Button
			onclick={() => examHook.gotoQuestion(question.id)}
			class="relative outline outline-green-400"
			variant={isCurrentQuestion ? 'default' : isAnswered ? 'secondary' : 'outline'}
		>
			{#if isAnswered}
				<div class="absolute -top-1 -right-1 size-2 rounded-full bg-green-200"></div>
			{/if}
			{question.number}
		</Button>
	{/each}
</div>
