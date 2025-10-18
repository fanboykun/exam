<script lang="ts">
	import { createExamState } from '$lib/hooks/exam-state.svelte.js';

	let { data } = $props();
	const examState = createExamState({ exam: data.exam });
</script>
