<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { ExamHook } from '$lib/hooks/exam-hook.svelte';
	interface Props {
		examHook: ExamHook;
	}
	let { examHook }: Props = $props();
</script>

<Card class="w-full max-w-md">
	<CardHeader class="text-center">
		<CardTitle class="text-3xl">Exam Complete!</CardTitle>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="space-y-4 text-center">
			<div
				class="inline-flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary bg-primary/10"
			>
				<div class="text-center">
					<div class="text-4xl font-bold text-primary">{examHook.assignment?.score ?? 0}</div>
					<!-- <div class="text-sm text-muted-foreground">Grade: {getGrade()}</div> -->
				</div>
			</div>
		</div>

		<div class="space-y-3 rounded-lg bg-muted p-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Correct Answers</span>
				<span class="text-lg font-bold text-green-600"
					>{examHook.assignment?.correctAnswer ?? 0}</span
				>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Incorrect Answers</span>
				<span class="text-lg font-bold text-red-600"
					>{examHook.questions.length - (examHook.assignment?.correctAnswer ?? 0)}</span
				>
			</div>
		</div>

		<Button size="lg" onclick={async () => await examHook.retakeExam()} class="w-full"
			>Retake Exam</Button
		>
	</CardContent>
</Card>
