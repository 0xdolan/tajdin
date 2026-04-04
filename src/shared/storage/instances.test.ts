import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StorageAreaMock = {
  _data: Record<string, unknown>;
  get(
    keys: string | string[] | null,
    callback: (items: { [key: string]: unknown }) => void,
  ): void;
  set(items: { [key: string]: unknown }, callback?: () => void): void;
  remove(keys: string | string[], callback?: () => void): void;
};

function createStorageAreaMock(): StorageAreaMock {
  const _data: Record<string, unknown> = {};
  return {
    _data,
    get(keys, callback) {
      if (keys == null) {
        callback({ ..._data });
        return;
      }
      const list = Array.isArray(keys) ? keys : [keys];
      const out: Record<string, unknown> = {};
      for (const k of list) {
        if (k in _data) {
          out[k] = _data[k];
        }
      }
      callback(out);
    },
    set(items, callback) {
      Object.assign(_data, items);
      callback?.();
    },
    remove(keys, callback) {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const k of list) {
        delete _data[k];
      }
      callback?.();
    },
  };
}

function stubChromeStorage(): { local: StorageAreaMock; session: StorageAreaMock } {
  const local = createStorageAreaMock();
  const session = createStorageAreaMock();
  const onChangedListeners = new Set<
    (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
  >();

  function wrapArea(area: StorageAreaMock, areaName: "local" | "session"): void {
    const origSet = area.set.bind(area);
    area.set = (items, callback) => {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of Object.keys(items)) {
        changes[key] = {
          oldValue: key in area._data ? area._data[key] : undefined,
          newValue: items[key],
        };
      }
      origSet(items, () => {
        for (const cb of onChangedListeners) {
          cb(changes, areaName);
        }
        callback?.();
      });
    };
    const origRemove = area.remove.bind(area);
    area.remove = (keys, callback) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const key of list) {
        changes[key] = { oldValue: area._data[key], newValue: undefined };
      }
      origRemove(keys, () => {
        for (const cb of onChangedListeners) {
          cb(changes, areaName);
        }
        callback?.();
      });
    };
  }

  wrapArea(local, "local");
  wrapArea(session, "session");

  vi.stubGlobal("chrome", {
    storage: {
      local,
      session,
      onChanged: {
        addListener(
          cb: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void,
        ) {
          onChangedListeners.add(cb);
        },
        removeListener(
          cb: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void,
        ) {
          onChangedListeners.delete(cb);
        },
      },
    },
    runtime: { lastError: undefined },
  });

  return { local, session };
}

describe("storage instances", () => {
  beforeEach(() => {
    vi.resetModules();
    stubChromeStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips playlists through local adapter + wrapper with STORAGE_KEYS", async () => {
    const { STORAGE_KEYS, localPlaylistsStorage } = await import("./instances");
    const playlist = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test",
      stationUuids: [],
      description: "",
      lastModified: new Date().toISOString(),
    };
    const setR = await localPlaylistsStorage.set(STORAGE_KEYS.playlists, [playlist]);
    expect(setR.success).toBe(true);
    const getR = await localPlaylistsStorage.get(STORAGE_KEYS.playlists);
    expect(getR.success).toBe(true);
    if (getR.success && "data" in getR) {
      expect(getR.data).toEqual([playlist]);
    }
  });

  it("round-trips session player state", async () => {
    const { STORAGE_KEYS, sessionPlayerStorage } = await import("./instances");
    const payload = { stationuuid: "abc", isPlaying: true, volumePercent: 50 };
    await sessionPlayerStorage.set(STORAGE_KEYS.sessionPlayer, payload);
    const getR = await sessionPlayerStorage.get(STORAGE_KEYS.sessionPlayer);
    expect(getR.success).toBe(true);
    if (getR.success && "data" in getR) {
      expect(getR.data).toMatchObject(payload);
    }
  });

  it("watch receives validated updates on local storage", async () => {
    const { STORAGE_KEYS, localFavouriteIdsStorage, storageLocal } = await import("./instances");
    const handler = vi.fn();
    const off = localFavouriteIdsStorage.watch(STORAGE_KEYS.favouriteIds, handler);
    await storageLocal.set({ [STORAGE_KEYS.favouriteIds]: ["u1", "u2"] });
    expect(handler).toHaveBeenCalledWith({ kind: "updated", data: ["u1", "u2"] });
    off();
  });
});
