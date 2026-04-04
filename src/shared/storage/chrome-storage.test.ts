import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ChromeStorageWrapper,
  StorageValidationError,
  type StorageAreaAdapter,
  type StorageChangeRecord,
} from "./chrome-storage";

function createMemoryAdapter(initial: Record<string, unknown> = {}): {
  adapter: StorageAreaAdapter;
  emit(changes: Record<string, StorageChangeRecord>): void;
} {
  const data = { ...initial };
  const listeners = new Set<(changes: Record<string, StorageChangeRecord>) => void>();
  const adapter: StorageAreaAdapter = {
    async get(keys) {
      if (keys == null || keys === undefined) {
        return { ...data };
      }
      const list = Array.isArray(keys) ? keys : [keys];
      const out: Record<string, unknown> = {};
      for (const k of list) {
        if (k in data) {
          out[k] = data[k];
        }
      }
      return out;
    },
    async set(items) {
      Object.assign(data, items);
    },
    async remove(keys) {
      for (const k of keys) {
        delete data[k];
      }
    },
    addStorageListener(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    adapter,
    emit(changes) {
      for (const l of [...listeners]) l(changes);
    },
  };
}

const ItemSchema = z.object({ id: z.string(), n: z.number() });

describe("ChromeStorageWrapper", () => {
  it("get returns missing when key absent", async () => {
    const { adapter } = createMemoryAdapter();
    const w = new ChromeStorageWrapper(adapter, ItemSchema);
    const r = await w.get("k");
    expect(r).toEqual({ success: true, missing: true });
  });

  it("set stores validated data and get returns it", async () => {
    const { adapter } = createMemoryAdapter();
    const w = new ChromeStorageWrapper(adapter, ItemSchema);
    const setR = await w.set("k", { id: "a", n: 1 });
    expect(setR.success).toBe(true);
    const getR = await w.get("k");
    expect(getR.success).toBe(true);
    if (getR.success && "data" in getR) {
      expect(getR.data).toEqual({ id: "a", n: 1 });
    }
  });

  it("set rejects invalid value", async () => {
    const { adapter } = createMemoryAdapter();
    const w = new ChromeStorageWrapper(adapter, ItemSchema);
    const r = await w.set("k", { id: "a", n: "bad" });
    expect(r.success).toBe(false);
  });

  it("get returns parse error for corrupted stored value", async () => {
    const { adapter } = createMemoryAdapter({ k: { id: 1 } });
    const w = new ChromeStorageWrapper(adapter, ItemSchema);
    const r = await w.get("k");
    expect(r.success).toBe(false);
  });

  it("remove deletes key", async () => {
    const { adapter } = createMemoryAdapter({ k: { id: "x", n: 0 } });
    const w = new ChromeStorageWrapper(adapter, ItemSchema);
    await w.remove("k");
    expect(await w.get("k")).toEqual({ success: true, missing: true });
  });

  describe("getWithDefault", () => {
    const def = { id: "def", n: -1 };

    it("returns default when key missing", async () => {
      const { adapter } = createMemoryAdapter();
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      await expect(w.getWithDefault("k", def)).resolves.toEqual(def);
    });

    it("returns stored value when valid", async () => {
      const { adapter } = createMemoryAdapter({ k: { id: "a", n: 2 } });
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      await expect(w.getWithDefault("k", def)).resolves.toEqual({ id: "a", n: 2 });
    });

    it("throws StorageValidationError when corrupt and onInvalidStored is throw", async () => {
      const { adapter } = createMemoryAdapter({ k: { bad: true } });
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      await expect(w.getWithDefault("k", def)).rejects.toBeInstanceOf(StorageValidationError);
    });

    it("returns default when corrupt and onInvalidStored is default", async () => {
      const { adapter } = createMemoryAdapter({ k: { bad: true } });
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      await expect(w.getWithDefault("k", def, { onInvalidStored: "default" })).resolves.toEqual(def);
    });
  });

  describe("watch", () => {
    it("throws when adapter has no addStorageListener", () => {
      const bare: StorageAreaAdapter = {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
      };
      const w = new ChromeStorageWrapper(bare, ItemSchema);
      expect(() => w.watch("k", vi.fn())).toThrow(/addStorageListener/);
    });

    it("notifies updated with validated data", () => {
      const { adapter, emit } = createMemoryAdapter();
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      const fn = vi.fn();
      w.watch("k", fn);
      emit({ k: { newValue: { id: "z", n: 3 } } });
      expect(fn).toHaveBeenCalledWith({ kind: "updated", data: { id: "z", n: 3 } });
    });

    it("notifies removed when newValue undefined", () => {
      const { adapter, emit } = createMemoryAdapter();
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      const fn = vi.fn();
      w.watch("k", fn);
      emit({ k: { oldValue: { id: "a", n: 1 }, newValue: undefined } });
      expect(fn).toHaveBeenCalledWith({ kind: "removed" });
    });

    it("notifies invalid for bad newValue", () => {
      const { adapter, emit } = createMemoryAdapter();
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      const fn = vi.fn();
      w.watch("k", fn);
      emit({ k: { newValue: { id: 1 } } });
      expect(fn).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "invalid", formatted: expect.any(String) }),
      );
    });

    it("unsubscribe stops notifications", () => {
      const { adapter, emit } = createMemoryAdapter();
      const w = new ChromeStorageWrapper(adapter, ItemSchema);
      const fn = vi.fn();
      const off = w.watch("k", fn);
      off();
      emit({ k: { newValue: { id: "z", n: 3 } } });
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
