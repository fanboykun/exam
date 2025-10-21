/**
 * PersistentMap - Wrapper asinkron untuk IndexedDB dengan antarmuka mirip Map
 *
 * @template K - Tipe untuk key
 * @template V - Tipe untuk value
 *
 * @example
 * ```typescript
 * const map = await PersistentMap.create<string, User>('myDB', 'users');
 * await map.set('user1', { name: 'John', age: 30 });
 * const user = await map.get('user1');
 * ```
 */
export class PersistentMap<K, V> {
	private db: IDBDatabase;
	private readonly storeName: string;

	/**
	 * Constructor privat - gunakan static method `create()` untuk inisialisasi
	 */
	private constructor(db: IDBDatabase, storeName: string) {
		this.db = db;
		this.storeName = storeName;
	}

	/**
	 * Factory method untuk membuat instance PersistentMap
	 *
	 * @param dbName - Nama database IndexedDB
	 * @param storeName - Nama object store
	 * @returns Promise yang resolve ke instance PersistentMap
	 *
	 * @example
	 * ```typescript
	 * const map = await PersistentMap.create<string, number>('appDB', 'settings');
	 * ```
	 */
	static async create<K, V>(dbName: string, storeName: string): Promise<PersistentMap<K, V>> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName, 1);

			request.onerror = () => reject(request.error);

			request.onsuccess = () => {
				const db = request.result;
				resolve(new PersistentMap<K, V>(db, storeName));
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(storeName)) {
					db.createObjectStore(storeName);
				}
			};
		});
	}

	/**
	 * Menyimpan pasangan key-value ke IndexedDB
	 *
	 * @param key - Key untuk disimpan
	 * @param value - Value untuk disimpan
	 * @returns Promise yang resolve ke instance ini (untuk method chaining)
	 *
	 * @example
	 * ```typescript
	 * await map.set('username', 'john_doe')
	 *   .then(m => m.set('email', 'john@example.com'));
	 * ```
	 */
	async set(key: K, value: V): Promise<this> {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.put(value, key as IDBValidKey);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(this);
		});
	}

	/**
	 * Mengambil value berdasarkan key dari IndexedDB
	 *
	 * @param key - Key yang ingin dicari
	 * @returns Promise yang resolve ke value atau undefined jika tidak ditemukan
	 *
	 * @example
	 * ```typescript
	 * const username = await map.get('username');
	 * if (username) {
	 *   console.log('Found:', username);
	 * }
	 * ```
	 */
	async get(key: K): Promise<V | undefined> {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.get(key as IDBValidKey);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result as V | undefined);
		});
	}

	/**
	 * Memeriksa apakah key ada di IndexedDB
	 *
	 * @param key - Key yang ingin diperiksa
	 * @returns Promise yang resolve ke boolean
	 *
	 * @example
	 * ```typescript
	 * if (await map.has('username')) {
	 *   console.log('Username exists');
	 * }
	 * ```
	 */
	async has(key: K): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.getKey(key as IDBValidKey);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result !== undefined);
		});
	}

	/**
	 * Menghapus entry berdasarkan key dari IndexedDB
	 *
	 * @param key - Key yang ingin dihapus
	 * @returns Promise yang resolve ke true jika berhasil, false jika key tidak ditemukan
	 *
	 * @example
	 * ```typescript
	 * const deleted = await map.delete('username');
	 * console.log(deleted ? 'Deleted' : 'Not found');
	 * ```
	 */
	async delete(key: K): Promise<boolean> {
		const exists = await this.has(key);
		if (!exists) return false;

		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.delete(key as IDBValidKey);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(true);
		});
	}

	/**
	 * Menghapus semua entry dari IndexedDB
	 *
	 * @returns Promise yang resolve ketika operasi selesai
	 *
	 * @example
	 * ```typescript
	 * await map.clear();
	 * console.log('All data cleared');
	 * ```
	 */
	async clear(): Promise<void> {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	/**
	 * Mendapatkan jumlah entry di IndexedDB
	 *
	 * @returns Promise yang resolve ke jumlah entry
	 *
	 * @example
	 * ```typescript
	 * const count = await map.size;
	 * console.log(`Total entries: ${count}`);
	 * ```
	 */
	get size(): Promise<number> {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.count();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}

	/**
	 * Iterator asinkron untuk mengiterasi semua entry [key, value]
	 *
	 * @yields Tuple [key, value] untuk setiap entry
	 *
	 * @example
	 * ```typescript
	 * for await (const [key, value] of map) {
	 *   console.log(key, value);
	 * }
	 * ```
	 */
	async *[Symbol.asyncIterator](): AsyncIterableIterator<[K, V]> {
		const transaction = this.db.transaction([this.storeName], 'readonly');
		const store = transaction.objectStore(this.storeName);
		const request = store.openCursor();

		const entries: [K, V][] = [];

		await new Promise<void>((resolve, reject) => {
			request.onerror = () => reject(request.error);

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					entries.push([cursor.key as K, cursor.value as V]);
					cursor.continue();
				} else {
					resolve();
				}
			};
		});

		for (const entry of entries) {
			yield entry;
		}
	}

	/**
	 * Menutup koneksi database
	 *
	 * @example
	 * ```typescript
	 * map.close();
	 * ```
	 */
	close(): void {
		this.db.close();
	}

	async getAll() {
		const entries: [K, V][] = [];

		for await (const [key, value] of this) {
			entries.push([key, value]);
		}

		return entries;
	}
}

export async function createPersistentMap<K, V>(
	dbName: string,
	storeName: string
): Promise<PersistentMap<K, V>> {
	return PersistentMap.create<K, V>(dbName, storeName);
}
