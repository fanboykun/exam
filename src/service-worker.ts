/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;
skipWaiting();
clientsClaim();

// This is the magic line. @vite-pwa/sveltekit injects your build files here.
// This REPLACES the old `precacheList` with `build`, `files`, etc.
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

const offlinePage = '/offline';
const navigationStrategy = new NetworkFirst({
	cacheName: 'navigations',
	plugins: [
		new CacheableResponsePlugin({
			statuses: [0, 200] // Cache successful pages and opaque responses
		})
	]
});

const navigationHandler = async (params) => {
	try {
		// Try to fetch the page from the network
		return await navigationStrategy.handle(params);
	} catch {
		// If network fails, serve the offline page from the precache
		return caches.match(offlinePage, {
			ignoreSearch: true
		}) as unknown as Response;
	}
};

// Register this handler for all navigation requests
registerRoute(new NavigationRoute(navigationHandler));

// Google Fonts CSS caching
registerRoute(
	/^https:\/\/fonts\.googleapis\.com\/.*/i,
	new CacheFirst({
		cacheName: 'google-fonts-cache',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 10,
				maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
			}),
			new CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Google Fonts assets caching
registerRoute(
	/^https:\/\/fonts\.gstatic\.com\/.*/i,
	new CacheFirst({
		cacheName: 'gstatic-fonts-cache',
		plugins: [
			new ExpirationPlugin({
				maxEntries: 10,
				maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
			}),
			new CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Image caching
registerRoute(
	({ url }) => url.pathname.match(/\.(jpg|jpeg|gif|png|svg|ico)$/),
	new CacheFirst({
		cacheName: 'images-cache',
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Remote functions GET - Network First with cache fallback
registerRoute(
	({ url, request }) => url.pathname.includes('/_app/remote/') && request.method === 'GET',
	new NetworkFirst({
		cacheName: 'remote-functions-cache',
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Remote functions POST - Network Only with Background Sync
const bgSyncPlugin = new BackgroundSyncPlugin('remote-functions-queue-POST', {
	maxRetentionTime: 24 * 60, // 24 hours in minutes,
	onSync: async ({ queue }) => {
		let entry;
		let successfulCount = 0;

		// Loop through all queued requests
		while ((entry = await queue.shiftRequest())) {
			try {
				// 1. Replay the failed request
				await fetch(entry.request.clone());

				// If fetch was successful, increment counter
				successfulCount++;
			} catch {
				// 2. If it fails again, put it back in the queue
				await queue.unshiftRequest(entry);

				// Stop processing this queue on failure
				break;
			}
		}
		if (successfulCount > 0) {
			// Find all open client windows
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			});

			// 4. Send a message to all of them!
			for (const client of clients) {
				client.postMessage({
					type: 'SYNC_COMPLETE',
					count: successfulCount
				});
			}
		}
	}
});

registerRoute(
	({ url, request }) => url.pathname.includes('/_app/remote/') && request.method === 'POST',
	new NetworkOnly({
		plugins: [bgSyncPlugin]
	}),
	'POST'
);

setDefaultHandler(new NetworkFirst());

// Message event for IndexedDB sync and skip waiting
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
	if (event.data?.type === 'CACHE_SYNC') {
		const { dbName, storeName, operation } = event.data;
		handleCacheSync(dbName, storeName, operation);
	}
});

// Push notification handler
self.addEventListener('push', (event) => {
	let data = {
		title: 'Notification',
		body: 'You have a new notification',
		icon: '/pwa-192x192.png',
		badge: '/pwa-64x64.png',
		data: { url: '/' },
		image: undefined,
		requireInteraction: false,
		silent: false,
		tag: undefined,
		actions: [
			{ action: 'open', title: 'Open' },
			{ action: 'close', title: 'Close' }
		]
	};

	if (event.data) {
		try {
			data = event.data.json();
		} catch (error) {
			console.error('[SW] Parse error:', error);
			data.body = event.data.text();
		}
	}

	const options = {
		body: data.body,
		icon: data.icon || '/pwa-192x192.png',
		badge: data.badge || '/pwa-64x64.png',
		image: data.image,
		vibrate: [200, 100, 200],
		tag: data.tag || `notification-${Date.now()}`,
		data: data.data || { url: '/' },
		requireInteraction: data.requireInteraction || false,
		silent: data.silent || false,
		actions: data.actions || [
			{ action: 'open', title: 'Open' },
			{ action: 'close', title: 'Close' }
		]
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'close') {
		return;
	}

	const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url === urlToOpen && 'focus' in client) {
					return client.focus();
				}
			}

			if (typeof self.clients.openWindow === 'function') {
				return self.clients.openWindow(urlToOpen);
			}
		})
	);
});

// IndexedDB sync functions
async function handleCacheSync(
	dbName: string,
	storeName: string,
	operation: {
		type: 'set' | 'delete' | 'clear';
		key?: unknown;
		value?: unknown;
		namespace?: string;
	}
) {
	try {
		const db = await openDatabase(dbName, storeName);

		switch (operation.type) {
			case 'set':
				await setItem(db, storeName, operation.key, operation.value);
				break;
			case 'delete':
				await deleteItem(db, storeName, operation.key);
				break;
			case 'clear':
				if (operation.namespace) {
					await clearNamespace(db, storeName, operation.namespace);
				} else {
					await clearStore(db, storeName);
				}
				break;
		}

		db.close();
	} catch (error) {
		console.error('IndexedDB sync error:', error);
	}
}

function openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, 1);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName, { keyPath: 'key' });
			}
		};
	});
}

function setItem(db: IDBDatabase, storeName: string, key: unknown, value: unknown): Promise<void> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.put({ key, value });

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

function deleteItem(db: IDBDatabase, storeName: string, key: unknown): Promise<void> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.delete(key as IDBValidKey);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

async function clearNamespace(
	db: IDBDatabase,
	storeName: string,
	namespace: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);
		const getAllKeysRequest = store.getAllKeys();

		getAllKeysRequest.onsuccess = async () => {
			const keys = getAllKeysRequest.result;
			const prefix = `${namespace}:`;

			for (const key of keys) {
				if (String(key).startsWith(prefix)) {
					await new Promise<void>((res, rej) => {
						const deleteRequest = store.delete(key);
						deleteRequest.onsuccess = () => res();
						deleteRequest.onerror = () => rej(deleteRequest.error);
					});
				}
			}
			resolve();
		};

		getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error);
	});
}
