import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ChromeStorageWrapper, type StorageAreaAdapter } from "./chrome-storage";

function createMemoryAdapter(initial: Record<string, unknown> = {}): StorageAreaAdapter {
  const data = { ...initial };
  return {
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
  };
}

const ItemSchema = z.object({ id: z.string(), n: z.number() });

describe("ChromeStorageWrapper", () => {
  it("get returns missing when key absent", async () => {
    const w = new ChromeStorageWrapper(createMemoryAdapter(), ItemSchema);
    const r = await w.get("k");
    expect(r).toEqual({ success: true, missing: true });
  });

  it("set stores validated data and get returns it", async () => {
    const w = new ChromeStorageWrapper(createMemoryAdapter(), ItemSchema);
    const setR = await w.set("k", { id: "a", n: 1 });
    expect(setR.success).toBe(true);
    const getR = await w.get("k");
    expect(getR.success).toBe(true);
    if (getR.success && "data" in getR) {
      expect(getR.data).toEqual({ id: "a", n: 1 });
    }
  });

  it("set rejects invalid value", async () => {
    const w = new ChromeStorageWrapper(createMemoryAdapter(), ItemSchema);
    const r = await w.set("k", { id: "a", n: "bad" });
    expect(r.success).toBe(false);
  });

  it("get returns parse error for corrupted stored value", async () => {
    const w = new ChromeStorageWrapper(createMemoryAdapter({ k: { id: 1 } }), ItemSchema);
    const r = await w.get("k");
    expect(r.success).toBe(false);
  });

  it("remove deletes key", async () => {
    const w = new ChromeStorageWrapper(createMemoryAdapter({ k: { id: "x", n: 0 } }), ItemSchema);
    await w.remove("k");
    expect(await w.get("k")).toEqual({ success: true, missing: true });
  });
});
