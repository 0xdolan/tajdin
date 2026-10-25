export type StorageChanges = Record<string, { newValue?: unknown; oldValue?: unknown }>;

/**
 * The slice of `chrome.storage.StorageArea` Tajdîn uses. The extension wraps
 * `browser.storage.local`/`session`; the web app uses {@link createWebStorageArea}.
 */
export interface StorageArea {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
  /** Fires for changes made in any page of the app, including this one. */
  onChanged(listener: (changes: StorageChanges) => void): () => void;
}

/** In-memory area for tests and as a fallback when browser storage is unavailable. */
export function createMemoryArea(initial: Record<string, unknown> = {}): StorageArea {
  const data = new Map(Object.entries(structuredClone(initial)));
  const listeners = new Set<(c: StorageChanges) => void>();
  const emit = (changes: StorageChanges) => listeners.forEach((l) => l(changes));
  return {
    async get(keys) {
      return Object.fromEntries(
        keys.filter((k) => data.has(k)).map((k) => [k, structuredClone(data.get(k))]),
      );
    },
    async set(items) {
      const changes: StorageChanges = {};
      for (const [k, v] of Object.entries(items)) {
        changes[k] = { oldValue: data.get(k), newValue: structuredClone(v) };
        data.set(k, structuredClone(v));
      }
      emit(changes);
    },
    async remove(keys) {
      const changes: StorageChanges = {};
      for (const k of keys) {
        if (!data.has(k)) continue;
        changes[k] = { oldValue: data.get(k) };
        data.delete(k);
      }
      if (Object.keys(changes).length) emit(changes);
    },
    onChanged(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * `localStorage`/`sessionStorage` area for the web app. Other tabs are notified through the
 * `storage` event; this tab through a local emitter. Falls back to memory when storage is blocked.
 */
export function createWebStorageArea(kind: 'local' | 'session'): StorageArea {
  let store: Storage;
  try {
    store = kind === 'local' ? window.localStorage : window.sessionStorage;
    store.getItem('tajdin.probe');
  } catch {
    return createMemoryArea();
  }
  const listeners = new Set<(c: StorageChanges) => void>();
  const emit = (changes: StorageChanges) => listeners.forEach((l) => l(changes));
  const read = (k: string): unknown => {
    const raw = store.getItem(k);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };
  window.addEventListener('storage', (event) => {
    if (event.storageArea !== store || !event.key) return;
    emit({ [event.key]: { newValue: event.newValue === null ? undefined : read(event.key) } });
  });
  return {
    async get(keys) {
      const out: Record<string, unknown> = {};
      for (const k of keys) {
        const v = read(k);
        if (v !== undefined) out[k] = v;
      }
      return out;
    },
    async set(items) {
      const changes: StorageChanges = {};
      for (const [k, v] of Object.entries(items)) {
        changes[k] = { oldValue: read(k), newValue: v };
        store.setItem(k, JSON.stringify(v));
      }
      emit(changes);
    },
    async remove(keys) {
      const changes: StorageChanges = {};
      for (const k of keys) {
        changes[k] = { oldValue: read(k) };
        store.removeItem(k);
      }
      emit(changes);
    },
    onChanged(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
