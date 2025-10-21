import { SvelteMap, SvelteSet } from 'svelte/reactivity';

/**
 * Interface untuk pesan yang dikirim dari UI ke Service Worker
 */
export interface MessageToSW {
	type: 'SET_ITEM' | 'DELETE_ITEM' | 'CLEAR_ALL' | 'GET_INITIAL_DATA';
	payload?: {
		key?: string;
		value?: unknown;
		storeName?: string;
	};
}

/**
 * Interface untuk pesan yang dikirim dari Service Worker ke UI
 */
export interface MessageFromSW {
	type: 'INITIAL_DATA' | 'ITEM_CHANGED' | 'ITEM_DELETED' | 'CLEARED';
	payload?: {
		data?: Map<string, unknown>;
		entries?: Array<[string, unknown]>;
		key?: string;
		value?: unknown;
	};
}

/**
 * Type untuk event listener yang menangani perubahan data
 */
export type DataChangeListener<K, V> = (
	type: 'set' | 'delete' | 'clear',
	key?: K,
	value?: V
) => void;

/**
 * SyncMap - Wrapper sinkron untuk Map dengan sinkronisasi otomatis ke IndexedDB via Service Worker
 *
 * @template K - Tipe untuk key
 * @template V - Tipe untuk value
 *
 * @example
 * ```typescript
 * const map = await SyncMap.create<string, User>('users');
 * map.set('user1', { name: 'John', age: 30 }); // Sinkron di UI, async di background
 * const user = map.get('user1'); // Langsung dari memory
 * ```
 */
export class SyncMap<K extends string, V> {
	private internalMap: Map<K, V>;
	private readonly storeName: string;
	private serviceWorker: ServiceWorker | null = null;
	private changeListeners: Set<DataChangeListener<K, V>> = new SvelteSet();

	/**
	 * Constructor privat - gunakan static method `create()` untuk inisialisasi
	 */
	private constructor(storeName: string) {
		this.storeName = storeName;
		this.internalMap = new SvelteMap<K, V>();
		this.setupMessageListener();
	}

	/**
	 * Factory method untuk membuat instance SyncMap
	 *
	 * @param storeName - Nama store untuk identifikasi di Service Worker
	 * @returns Promise yang resolve ke instance SyncMap
	 *
	 * @example
	 * ```typescript
	 * const map = await SyncMap.create<string, number>('settings');
	 * ```
	 */
	static async create<K extends string, V>(storeName: string): Promise<SyncMap<K, V>> {
		const instance = new SyncMap<K, V>(storeName);
		await instance.initialize();
		return instance;
	}

	/**
	 * Inisialisasi koneksi ke Service Worker dan memuat data awal
	 */
	private async initialize(): Promise<void> {
		// Pastikan Service Worker sudah ready
		// if (!navigator.serviceWorker.controller) {
		// 	await new Promise<void>((resolve) => {
		// 		navigator.serviceWorker.addEventListener(
		// 			'controllerchange',
		// 			() => {
		// 				resolve();
		// 			},
		// 			{ once: true }
		// 		);
		// 	});
		// }

		// this.serviceWorker = navigator.serviceWorker.controller;
		const registration = await navigator.serviceWorker.ready;
		this.serviceWorker = registration.active;

		// Minta data awal dari Service Worker
		// await this.loadInitialData();
	}

	/**
	 * Memuat data awal dari Service Worker
	 */
	private async loadInitialData(): Promise<void> {
		return new Promise((resolve) => {
			const channel = new MessageChannel();

			channel.port1.onmessage = (event: MessageEvent<MessageFromSW>) => {
				if (event.data.type === 'INITIAL_DATA' && event.data.payload?.entries) {
					this.internalMap.clear();
					for (const [key, value] of event.data.payload.entries) {
						this.internalMap.set(key as K, value as V);
					}
					resolve();
				}
			};

			const message: MessageToSW = {
				type: 'GET_INITIAL_DATA',
				payload: { storeName: this.storeName }
			};

			this.serviceWorker?.postMessage(message, [channel.port2]);
		});
	}

	/**
	 * Setup listener untuk menerima pesan dari Service Worker
	 */
	private setupMessageListener(): void {
		navigator.serviceWorker.addEventListener('message', (event: MessageEvent<MessageFromSW>) => {
			const { type, payload } = event.data;

			switch (type) {
				case 'ITEM_CHANGED':
					if (payload?.key && payload?.value !== undefined) {
						this.internalMap.set(payload.key as K, payload.value as V);
						this.notifyListeners('set', payload.key as K, payload.value as V);
					}
					break;

				case 'ITEM_DELETED':
					if (payload?.key) {
						this.internalMap.delete(payload.key as K);
						this.notifyListeners('delete', payload.key as K);
					}
					break;

				case 'CLEARED':
					this.internalMap.clear();
					this.notifyListeners('clear');
					break;
			}
		});
	}

	/**
	 * Mengirim pesan ke Service Worker
	 */
	private postMessageToSW(message: MessageToSW): void {
		if (this.serviceWorker) {
			this.serviceWorker.postMessage(message);
		}
	}

	/**
	 * Notify semua listener tentang perubahan data
	 */
	private notifyListeners(type: 'set' | 'delete' | 'clear', key?: K, value?: V): void {
		for (const listener of this.changeListeners) {
			listener(type, key, value);
		}
	}

	/**
	 * Menyimpan pasangan key-value (sinkron di UI, async di background)
	 *
	 * @param key - Key untuk disimpan
	 * @param value - Value untuk disimpan
	 * @returns Instance ini untuk method chaining
	 *
	 * @example
	 * ```typescript
	 * map.set('username', 'john_doe')
	 *    .set('email', 'john@example.com');
	 * ```
	 */
	set(key: K, value: V): this {
		// Update Map internal secara sinkron
		this.internalMap.set(key, value);

		// Kirim pesan ke Service Worker untuk persist
		const message: MessageToSW = {
			type: 'SET_ITEM',
			payload: {
				storeName: this.storeName,
				key,
				value
			}
		};
		this.postMessageToSW(message);

		return this;
	}

	/**
	 * Mengambil value berdasarkan key (operasi sinkron dari memory)
	 *
	 * @param key - Key yang ingin dicari
	 * @returns Value atau undefined jika tidak ditemukan
	 *
	 * @example
	 * ```typescript
	 * const username = map.get('username');
	 * ```
	 */
	get(key: K): V | undefined {
		return this.internalMap.get(key);
	}

	/**
	 * Memeriksa apakah key ada (operasi sinkron dari memory)
	 *
	 * @param key - Key yang ingin diperiksa
	 * @returns Boolean
	 *
	 * @example
	 * ```typescript
	 * if (map.has('username')) {
	 *   console.log('Username exists');
	 * }
	 * ```
	 */
	has(key: K): boolean {
		return this.internalMap.has(key);
	}

	/**
	 * Menghapus entry berdasarkan key (sinkron di UI, async di background)
	 *
	 * @param key - Key yang ingin dihapus
	 * @returns true jika entry dihapus, false jika tidak ditemukan
	 *
	 * @example
	 * ```typescript
	 * const deleted = map.delete('username');
	 * ```
	 */
	delete(key: K): boolean {
		const existed = this.internalMap.delete(key);

		if (existed) {
			const message: MessageToSW = {
				type: 'DELETE_ITEM',
				payload: {
					storeName: this.storeName,
					key
				}
			};
			this.postMessageToSW(message);
		}

		return existed;
	}

	/**
	 * Menghapus semua entry (sinkron di UI, async di background)
	 *
	 * @example
	 * ```typescript
	 * map.clear();
	 * ```
	 */
	clear(): void {
		this.internalMap.clear();

		const message: MessageToSW = {
			type: 'CLEAR_ALL',
			payload: {
				storeName: this.storeName
			}
		};
		this.postMessageToSW(message);
	}

	/**
	 * Mendapatkan jumlah entry (operasi sinkron dari memory)
	 *
	 * @returns Jumlah entry
	 *
	 * @example
	 * ```typescript
	 * console.log(`Total entries: ${map.size}`);
	 * ```
	 */
	get size(): number {
		return this.internalMap.size;
	}

	/**
	 * Mendapatkan iterator untuk keys
	 *
	 * @example
	 * ```typescript
	 * for (const key of map.keys()) {
	 *   console.log(key);
	 * }
	 * ```
	 */
	keys(): IterableIterator<K> {
		return this.internalMap.keys();
	}

	/**
	 * Mendapatkan iterator untuk values
	 *
	 * @example
	 * ```typescript
	 * for (const value of map.values()) {
	 *   console.log(value);
	 * }
	 * ```
	 */
	values(): IterableIterator<V> {
		return this.internalMap.values();
	}

	/**
	 * Mendapatkan iterator untuk entries [key, value]
	 *
	 * @example
	 * ```typescript
	 * for (const [key, value] of map.entries()) {
	 *   console.log(key, value);
	 * }
	 * ```
	 */
	entries(): IterableIterator<[K, V]> {
		return this.internalMap.entries();
	}

	/**
	 * Iterator untuk menggunakan dengan for...of
	 *
	 * @example
	 * ```typescript
	 * for (const [key, value] of map) {
	 *   console.log(key, value);
	 * }
	 * ```
	 */
	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.internalMap.entries();
	}

	/**
	 * Menjalankan fungsi callback untuk setiap entry
	 *
	 * @param callbackfn - Fungsi yang akan dijalankan untuk setiap entry
	 * @param thisArg - Nilai this untuk callback
	 *
	 * @example
	 * ```typescript
	 * map.forEach((value, key) => {
	 *   console.log(key, value);
	 * });
	 * ```
	 */
	forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: unknown): void {
		this.internalMap.forEach(callbackfn, thisArg);
	}

	/**
	 * Menambahkan listener untuk perubahan data
	 *
	 * @param listener - Fungsi callback yang akan dipanggil saat data berubah
	 *
	 * @example
	 * ```typescript
	 * map.addChangeListener((type, key, value) => {
	 *   console.log(`Data ${type}:`, key, value);
	 * });
	 * ```
	 */
	addChangeListener(listener: DataChangeListener<K, V>): void {
		this.changeListeners.add(listener);
	}

	/**
	 * Menghapus listener perubahan data
	 *
	 * @param listener - Fungsi callback yang akan dihapus
	 */
	removeChangeListener(listener: DataChangeListener<K, V>): void {
		this.changeListeners.delete(listener);
	}

	get cache() {
		return this.internalMap;
	}
}

export async function createSyncMap<K extends string, V>(
	storeName: string
): Promise<SyncMap<K, V>> {
	return await SyncMap.create<K, V>(storeName);
}
