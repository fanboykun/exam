<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ExamDetail from './(components)/exam-detail.svelte';
	import ExamQuestions from './(components)/exam-questions.svelte';

	let step = $state<'detail' | 'questions'>('detail');
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Create new exams</Card.Title>
		<Card.Description>Add Exams questions</Card.Description>
	</Card.Header>
	<Card.Content>
		<Tabs.Root bind:value={step} class="w-full">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="detail">Detail</Tabs.Trigger>
				<Tabs.Trigger value="questions">Questions</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="detail">
				<ExamDetail />
			</Tabs.Content>
			<Tabs.Content value="questions">
				<ExamQuestions />
			</Tabs.Content>
		</Tabs.Root>
	</Card.Content>
	<Card.Footer class="gap-2 sm:justify-end">
		<Button
			onclick={() => {
				step = 'detail';
			}}>Prev</Button
		>
		<Button
			onclick={() => {
				step = 'questions';
			}}>Next</Button
		>
	</Card.Footer>
</Card.Root>
