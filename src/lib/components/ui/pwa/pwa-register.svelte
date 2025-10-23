<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { pwaInfo } from 'virtual:pwa-info';
	import { registerSW } from 'virtual:pwa-register';

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(() => {
		if (pwaInfo) {
			const updateSW = registerSW({
				immediate: true,
				onNeedRefresh() {
					// Show update available notification
					toast.info('New content available, please refresh.', {
						action: {
							label: 'Refresh',
							onClick: () => updateSW()
						},
						closeButton: true,
						richColors: false
					});
				},
				onOfflineReady() {
					// Show ready to work offline notification
					toast.info('Offline Ready', {
						richColors: false,
						closeButton: true
					});
				}
			});
		}
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html webManifestLink}
</svelte:head>
