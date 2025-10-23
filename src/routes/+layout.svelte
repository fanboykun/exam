<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import PWAPrompt from '$lib/components/ui/pwa/pwa-prompt.svelte';
	import PwaRegister from '$lib/components/ui/pwa/pwa-register.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title>Sveltekit Remote Function Starter</title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
</svelte:head>

<PwaRegister />
<ModeWatcher />
{@render children?.()}
<PWAPrompt />
