import { browser } from 'wxt/browser';
import { createMemoryArea, type StorageArea, type StorageChanges } from '@tajdin/core';

/** {@link StorageArea} over `browser.storage.local` / `.session`. */
export function extensionArea(kind: 'local' | 'session'): StorageArea {
  const area = browser.storage[kind];
  // storage.session needs Chrome 102+ / Firefox 115+; fall back to memory rather than break.
  if (!area) return createMemoryArea();
  return {
    get: (keys) => area.get(keys) as Promise<Record<string, unknown>>,
    set: (items) => area.set(items),
    remove: (keys) => area.remove(keys),
    onChanged(listener) {
      const handler = (
        changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
        areaName: string,
      ) => {
        if (areaName === kind) listener(changes as StorageChanges);
      };
      browser.storage.onChanged.addListener(handler);
      return () => browser.storage.onChanged.removeListener(handler);
    },
  };
}
