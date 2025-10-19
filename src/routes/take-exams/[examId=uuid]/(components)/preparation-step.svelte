<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { ExamHook } from '$lib/hooks/exam-hook.svelte';
	import { InfinityIcon } from '@lucide/svelte';
	interface Props {
		examHook: ExamHook;
	}
	let { examHook }: Props = $props();
</script>

<Card class="w-full max-w-md">
	<CardHeader class="text-center">
		<CardTitle class="text-3xl">Exam Ready?</CardTitle>
		<CardDescription>Test your knowledge with our comprehensive exam</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="space-y-4 rounded-lg bg-muted p-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Total Questions</span>
				<span class="text-lg font-bold">{examHook.questions.length}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Time Limit</span>
				<span class="text-lg font-bold"></span>
				{#if examHook.exam.duration}
					{examHook.exam.duration} Minutes
				{:else}
					<InfinityIcon />
				{/if}
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Question Type</span>
				<span class="text-lg font-bold">Multiple Choice</span>
			</div>
		</div>

		<div class="space-y-2">
			<h3 class="font-semibold">Instructions:</h3>
			<ul class="list-inside list-disc space-y-1 text-sm text-muted-foreground">
				<li>Answer all questions within the time limit</li>
				<li>You can review and change your answers</li>
				<li>Click Submit to finish the exam</li>
			</ul>
		</div>

		<Button
			size="lg"
			disabled={examHook.createAssigmentHandler.processing}
			onclick={async () => examHook.startExam()}
			class="w-full">Start Exam</Button
		>
	</CardContent>
</Card>
