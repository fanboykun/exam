<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { ExamHook } from '$lib/hooks/exam-hook.svelte';
	interface Props {
		examHook: ExamHook;
	}
	let { examHook }: Props = $props();
</script>

<div class="flex min-h-full w-full flex-col gap-4">
	<Card>
		<CardHeader>
			<CardTitle>Summary</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Answered Questions</span>
				<span class="text-lg font-bold">
					{examHook.answers.size}/{examHook.questions.length}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Unanswered Questions</span>
				<span class="text-lg font-bold">{examHook.questions.length - examHook.answers.size}</span>
			</div>
		</CardContent>
	</Card>
	<div class="flex justify-center gap-4">
		<Button
			disabled={examHook.finishAssignmentHandler.processing}
			onclick={async () => examHook.finishExam()}
			size="lg"
			class="bg-green-600 hover:bg-green-700"
		>
			Submit Exam
		</Button>
	</div>
</div>
