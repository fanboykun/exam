import { toast } from 'svelte-sonner';

export class OfflineSyncManager {
	private isOnline = $state(true);
	private pendingRequests = $state(0);

	constructor() {
		$effect.root(() => {
			this.isOnline = navigator.onLine;
			this.setupListeners();
		});
	}

	private setupListeners() {
		window.addEventListener('online', () => {
			this.isOnline = true;
			toast.success('Back online! Syncing pending requests...');
		});

		window.addEventListener('offline', () => {
			this.isOnline = false;
			toast.warning('You are offline. Changes will be synced when online.');
		});

		// Listen for sync events from service worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('message', (event) => {
				if (event.data?.type === 'SYNC_COMPLETE') {
					let clicked = false;
					toast.success('Offline changes synced successfully!', {
						action: {
							label: 'Reload',
							onClick: () => {
								clicked = true;
								window.location.reload();
							}
						}
					});
					if (!clicked) setTimeout(() => window.location.reload(), 3000);
				} else if (event.data?.type === 'SYNC_FAILED') {
					toast.error('Failed to sync some changes. Will retry later.');
				} else if (event.data?.type === 'SYNC_STARTED') {
					toast.info('Syncing offline changes...');
				}
			});
		}
	}

	get online() {
		return this.isOnline;
	}

	get offline() {
		return !this.isOnline;
	}

	get hasPendingRequests() {
		return this.pendingRequests > 0;
	}
}

export const offlineSyncManager = new OfflineSyncManager();
