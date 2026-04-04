import { STORAGE_KEYS } from "./storage-keys";

/**
 * Pre–Tajdîn `chrome.storage` key names. On startup we copy each value to
 * {@link STORAGE_KEYS} when the new key is absent, then remove the legacy key.
 */
const LEGACY_STORAGE_KEYS = {
  playlists: "zeng.playlists.v1",
  customStations: "zeng.customStations.v1",
  favouriteIds: "zeng.favouriteIds.v1",
  settings: "zeng.settings.v1",
  sessionPlayer: "zeng.session.player.v1",
  sessionUi: "zeng.session.ui.v1",
} as const;

function pairs(): { legacy: string; next: string }[] {
  return (Object.keys(LEGACY_STORAGE_KEYS) as (keyof typeof LEGACY_STORAGE_KEYS)[]).map((k) => ({
    legacy: LEGACY_STORAGE_KEYS[k],
    next: STORAGE_KEYS[k],
  }));
}

function promisifyGet(area: chrome.storage.StorageArea, keys: string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    area.get(keys, (items) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(items as Record<string, unknown>);
    });
  });
}

function promisifySet(area: chrome.storage.StorageArea, items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    area.set(items, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

function promisifyRemove(area: chrome.storage.StorageArea, keys: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    area.remove(keys, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

async function migrateArea(area: chrome.storage.StorageArea): Promise<void> {
  const ps = pairs();
  const keySet = new Set<string>();
  for (const { legacy, next } of ps) {
    keySet.add(legacy);
    keySet.add(next);
  }
  const items = await promisifyGet(area, [...keySet]);
  const toSet: Record<string, unknown> = {};
  const toRemove: string[] = [];
  for (const { legacy, next } of ps) {
    const hasNext = Object.prototype.hasOwnProperty.call(items, next) && items[next] !== undefined;
    const hasLegacy =
      Object.prototype.hasOwnProperty.call(items, legacy) && items[legacy] !== undefined;
    if (!hasNext && hasLegacy) {
      toSet[next] = items[legacy];
      toRemove.push(legacy);
    }
  }
  if (Object.keys(toSet).length > 0) {
    await promisifySet(area, toSet);
  }
  if (toRemove.length > 0) {
    await promisifyRemove(area, toRemove);
  }
}

/** Copy legacy `zeng.*` keys to `tajdin.*` in local and session storage, then delete the old keys. */
export async function ensureLegacyStorageMigrated(): Promise<void> {
  await migrateArea(chrome.storage.local);
  await migrateArea(chrome.storage.session);
}
