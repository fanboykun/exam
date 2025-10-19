<script lang="ts">
	import { createExamHook } from '$lib/hooks/exam-hook.svelte.js';
	import * as Card from '$lib/components/ui/card';
	import PreparationStep from './(components)/preparation-step.svelte';
	import ProgressStep from './(components)/progress-step.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import SummaryStep from './(components)/summary-step.svelte';
	import { Button } from '$lib/components/ui/button';
	import QuestionList from './(components)/question-list.svelte';
	import ResultStep from './(components)/result-step.svelte';
	import { titleCase } from '$lib/shared/utils/text';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { onMount } from 'svelte';

	let { data } = $props();
	const examHook = createExamHook({
		exam: data.exam,
		assignment: data.assignment
	});
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		examHook.handleBeforeUnload(event);
	};
	onMount(() => {
		if (data.assignment) {
			examHook.checkAnswerFromLocalStorage(data.assignment.id);
			examHook.currentState = 'progress';
		}
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});
</script>

<div class="relative mx-auto min-h-screen w-full p-8">
	<Card.Root class="min-h-full p-4">
		<Card.Header>
			<Card.Title>
				{examHook.exam.title}
			</Card.Title>
			<Card.Description>
				<Badge>
					{titleCase(examHook.currentState)}
				</Badge>
			</Card.Description>
			<Card.Action>
				{examHook.timeLeft}
			</Card.Action>
		</Card.Header>
		<Card.Content class="flex h-full min-h-full items-center justify-center">
			{#if examHook.currentState === 'preparation'}
				<PreparationStep {examHook} />
			{:else if examHook.currentState === 'progress'}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-5">
					<div class="hidden sm:block">
						<QuestionList {examHook} />
					</div>
					<div class="flex h-full items-center justify-center sm:col-span-4">
						<ProgressStep {examHook} />
					</div>
				</div>
			{:else if examHook.currentState === 'summary'}
				<SummaryStep {examHook} />
			{:else if examHook.currentState === 'result'}
				<ResultStep {examHook} />
			{/if}
		</Card.Content>
		{#if examHook.currentState === 'progress'}
			<Button
				class="absolute bottom-5 left-5 block sm:hidden"
				onclick={() => (examHook.isQuestionListOpen = true)}>Pertanyaan</Button
			>
		{/if}
	</Card.Root>
</div>

<Sheet.Root bind:open={examHook.isQuestionListOpen}>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>List Pertanyaan</Sheet.Title>
		</Sheet.Header>
		<div class="flex items-center justify-center px-4 py-2">
			<QuestionList {examHook} />
		</div>
	</Sheet.Content>
</Sheet.Root>
