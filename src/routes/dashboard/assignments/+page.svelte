<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { paginateAssignments } from '$lib/remotes/assignment.remote';
	import { formatDate } from '$lib/shared/utils/date';
	import {
		BookCheck
		//  Clock
	} from '@lucide/svelte';

	const assignments = await paginateAssignments({});
	const getScoreBadgeColor = (score: number) => {
		if (score >= 80) return 'text-green-400';
		if (score >= 60) return 'text-yellow-400';
		return 'text-red-400';
	};
</script>

{#if assignments.success}
	<div class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
		{#each assignments.data as assignment}
			<!-- {@const timeTaken =
				assignment.finishAt?.getTime() ?? Date.now() - assignment.startAt.getTime()} -->
			{@const status = assignment.finishAt ? 'Completed' : 'Ongoing'}
			<Card.Root>
				<Card.Header>
					<Card.Title>{assignment.exam.title}</Card.Title>
					<Card.Description class="flex flex-wrap gap-2">
						<Badge variant={status === 'Completed' ? 'default' : 'outline'}>{status}</Badge>
						{#if assignment.finishAt}
							<Badge variant="secondary">
								Finished At: {formatDate(assignment.finishAt)}
							</Badge>
						{/if}
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-wrap gap-4 text-sm">
					{#if assignment.finishAt}
						<p class="flex items-center gap-2 {getScoreBadgeColor(assignment.score ?? 0)}">
							<BookCheck class="size-4" />
							Score: {assignment.score}
						</p>
						<!-- <p class="flex items-center gap-2 text-muted-foreground">
							<Clock class="size-4" />
							Time Taken: {Math.ceil(timeTaken / 60)} Min
						</p> -->
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
{/if}
