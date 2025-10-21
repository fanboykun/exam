import { SvelteMap } from 'svelte/reactivity';

const DB_NAME = 'app-cache-db';
const STORE_NAME = 'cache-store';
const DB_VERSION = 1;

export class SyncedCache<K, V> {
	private cache = new SvelteMap<K, V>();
	private namespace: string;

	constructor(namespace: string) {
		this.namespace = namespace;
	}

	private makeKey(key: K): string {
		return `${this.namespace}:${String(key)}`;
	}

	private async syncToIndexedDB(type: 'set' | 'delete' | 'clear', key?: K, value?: V) {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
			console.warn('Service Worker not supported');
			return;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			if (!registration.active) {
				console.warn('Service Worker not active');
				return;
			}

			const compositeKey = key !== undefined ? this.makeKey(key) : undefined;

			registration.active.postMessage({
				type: 'CACHE_SYNC',
				dbName: DB_NAME,
				storeName: STORE_NAME,
				operation: {
					type,
					key: compositeKey,
					value,
					namespace: this.namespace
				}
			});
		} catch (error) {
			console.error('Failed to sync to service worker:', error);
		}
	}

	set(key: K, value: V): this {
		this.cache.set(key, value);
		this.syncToIndexedDB('set', key, value);
		return this;
	}

	get(key: K): V | undefined {
		return this.cache.get(key);
	}

	has(key: K): boolean {
		return this.cache.has(key);
	}

	delete(key: K): boolean {
		const result = this.cache.delete(key);
		if (result) {
			this.syncToIndexedDB('delete', key);
		}
		return result;
	}

	get size(): number {
		return this.cache.size;
	}

	keys(): IterableIterator<K> {
		return this.cache.keys();
	}

	values(): IterableIterator<V> {
		return this.cache.values();
	}

	entries(): IterableIterator<[K, V]> {
		return this.cache.entries();
	}

	forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: unknown): void {
		this.cache.forEach(callbackfn, thisArg);
	}

	async loadFromIndexedDB(): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const db = await this.openDatabase();
			const transaction = db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const items = await this.promisifyRequest<Array<{ key: string; value: V }>>(store.getAll());

			// Filter items by namespace and restore to cache
			items.forEach((item) => {
				if (item.key.startsWith(`${this.namespace}:`)) {
					const originalKey = item.key.substring(this.namespace.length + 1) as K;
					this.cache.set(originalKey, item.value);
				}
			});

			db.close();
		} catch (error) {
			console.error('Failed to load from IndexedDB:', error);
		}
	}

	private openDatabase(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: 'key' });
				}
			};
		});
	}

	private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	clear(): void {
		this.cache.clear();
		this.syncToIndexedDB('clear');
	}

	async clearNamespace(): Promise<void> {
		if (typeof window === 'undefined') return;

		try {
			const db = await this.openDatabase();
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const items = await this.promisifyRequest<IDBValidKey[]>(store.getAllKeys());

			// Delete all items in this namespace
			for (const key of items) {
				if (String(key).startsWith(`${this.namespace}:`)) {
					await this.promisifyRequest(store.delete(key));
				}
			}

			db.close();
			this.cache.clear();
		} catch (error) {
			console.error('Failed to clear namespace from IndexedDB:', error);
		}
	}
}
