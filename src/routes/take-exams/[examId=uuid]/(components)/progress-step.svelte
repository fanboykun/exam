<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardFooter,
		// CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { ExamHook } from '$lib/hooks/exam-hook.svelte';
	interface Props {
		examHook: ExamHook;
	}
	let { examHook }: Props = $props();
</script>

<Card class="min-w-full">
	<CardHeader>
		<CardTitle class="text-xl"
			>{examHook.currentQuestion.number} . {examHook.currentQuestion.content}</CardTitle
		>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-3">
			{#each examHook.currentQuestion.choises as choice}
				{@const isCurrentAswer = examHook.isCurrentAnswer(choice.id)}
				<button
					onclick={() => examHook.answerQuestion(choice.id)}
					class="w-full rounded-lg border-2 p-4 text-left transition-all {isCurrentAswer
						? 'border-primary bg-primary/10'
						: 'border-border hover:border-primary/50'}
					"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-5 w-5 items-center justify-center rounded-full border-2 {isCurrentAswer
								? 'border-primary bg-primary'
								: 'border-muted-foreground'}"
						>
							<div class="h-2 w-2 rounded-full bg-primary-foreground"></div>
						</div>
						<span>{choice.content}</span>
					</div>
				</button>
			{/each}
		</div>
	</CardContent>
	<CardFooter class="gap-2">
		<Button
			variant="outline"
			disabled={!examHook.canGoPrev()}
			onclick={() => examHook.prevQuestion()}>Sebelumnya</Button
		>
		{#if examHook.canViewSummary()}
			<Button onclick={() => examHook.viewSummary()}>Review Jawaban</Button>
		{:else}
			<Button
				variant="outline"
				disabled={!examHook.canGoNext()}
				onclick={() => examHook.nextQuestion()}>Selanjutnya</Button
			>
		{/if}
	</CardFooter>
</Card>
