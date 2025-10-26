<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { paginateExams } from '$lib/remotes/exam.remote';
	import { Clock, MessageCircleQuestionIcon } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	const exams = await paginateExams({});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Exams</Card.Title>
		<Card.Description>Take exams and get your results</Card.Description>
		<Card.Action>
			<Button href="/dashboard/exams/new" variant="outline">Create Exam</Button>
		</Card.Action>
	</Card.Header>
	<Card.Content>
		<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
			{#each exams as exam}
				<Card.Root>
					<Card.Header>
						<Card.Title>{exam.title}</Card.Title>
						<Card.Description>{exam.description}</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-wrap gap-4">
						<p class="flex items-center gap-2 text-muted-foreground">
							<Clock class="size-4" />
							{exam.duration} Min
						</p>
						<p class="flex items-center gap-2 text-muted-foreground">
							<MessageCircleQuestionIcon class="size-4" />
							{exam.questionCount} Question
						</p>
						<Badge variant="outline">Multiple Choises</Badge>
					</Card.Content>
					<Card.Footer>
						<Button href="/take-exams/{exam.id}">Take Exam</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
