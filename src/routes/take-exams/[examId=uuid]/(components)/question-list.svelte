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
		<Button
			onclick={() => examHook.gotoQuestion(question.id)}
			variant={isCurrentQuestion ? 'default' : 'outline'}>{question.number}</Button
		>
	{/each}
</div>
