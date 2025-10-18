<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card';
	import { Clock } from '@lucide/svelte';
	let { data } = $props();
</script>

{#each data.exams as exam}
	<Card.Root>
		<Card.Header>
			<Card.Title>{exam.title}</Card.Title>
			<Card.Description>{exam.description}</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="flex items-center gap-2 text-muted-foreground">
				<Clock class="size-4" />
				{exam.duration} Min
			</p>
		</Card.Content>
		<Card.Footer>
			<Button href="/take-exams/{exam.id}">Take Exam</Button>
		</Card.Footer>
	</Card.Root>
{/each}
