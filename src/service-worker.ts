/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `cache-${version}`;
const ASSETS = [...build, ...files];

// Install event
sw.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(ASSETS);
	}
	event.waitUntil(addFilesToCache());
});

// Activate event
sw.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE_NAME) await caches.delete(key);
		}
	}
	event.waitUntil(deleteOldCaches());
});

// Fetch event
sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Ignore chrome extension requests
	if (url.protocol === 'chrome-extension:') return;

	async function respond() {
		const cache = await caches.open(CACHE_NAME);

		// Serve build files from cache
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) return cachedResponse;
		}

		// Try network first, fall back to cache
		try {
			const response = await fetch(event.request);
			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch {
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) return cachedResponse;
		}

		return new Response('Not found', { status: 404 });
	}

	event.respondWith(respond());
});

// Message event for IndexedDB sync
sw.addEventListener('message', (event) => {
	if (event.data?.type === 'CACHE_SYNC') {
		const { dbName, storeName, operation } = event.data;
		handleCacheSync(dbName, storeName, operation);
	}
});

// Listen for successful background sync
sw.addEventListener('sync', async (event) => {
	if (event.tag === 'remote-functions-queue-POST') {
		event.waitUntil(handleBackgroundSync());
	}
});

async function handleBackgroundSync() {
	try {
		// Notify clients that sync is happening
		const clients = await sw.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({ type: 'SYNC_STARTED' });
		});

		// Workbox handles the actual replay of queued requests
		// We just notify clients when it's done
		const clients2 = await sw.clients.matchAll();
		clients2.forEach((client) => {
			client.postMessage({ type: 'SYNC_COMPLETE' });
		});
	} catch (error) {
		console.error('Background sync failed:', error);
		const clients = await sw.clients.matchAll();
		clients.forEach((client) => {
			client.postMessage({ type: 'SYNC_FAILED' });
		});
	}
}

sw.addEventListener('push', (event) => {
	let data = {
		title: 'Notification',
		body: 'You have a new notification',
		icon: '/icon-192x192.png',
		badge: '/badge-72x72.png',
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
		icon: data.icon || '/icon-192x192.png',
		badge: data.badge || '/badge-72x72.png',
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

	event.waitUntil(sw.registration.showNotification(data.title, options));
});

sw.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'close') {
		return;
	}

	const urlToOpen = new URL(event.notification.data?.url || '/', sw.location.origin).href;

	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url === urlToOpen && 'focus' in client) {
					return client.focus();
				}
			}

			if (typeof sw.clients.openWindow === 'function') {
				return sw.clients.openWindow(urlToOpen);
			}
		})
	);
});

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
