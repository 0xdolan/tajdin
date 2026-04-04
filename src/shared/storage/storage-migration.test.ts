import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Store = Record<string, unknown>;

describe("ensureLegacyStorageMigrated", () => {
  const stores = { local: {} as Store, session: {} as Store };

  beforeEach(() => {
    stores.local = {};
    stores.session = {};
    stores.local["zeng.settings.v1"] = { theme: "dark" };
    stores.session["zeng.session.ui.v1"] = { activeTab: "browse" };

    vi.stubGlobal("chrome", {
      runtime: { lastError: undefined },
      storage: {
        local: {
          get: vi.fn((keys: string | string[], cb: (o: Store) => void) => {
            const want = Array.isArray(keys) ? keys : [keys];
            const out: Store = {};
            for (const k of want) {
              if (k in stores.local) out[k] = stores.local[k];
            }
            cb(out);
          }),
          set: vi.fn((items: Store, cb: () => void) => {
            Object.assign(stores.local, items);
            cb();
          }),
          remove: vi.fn((keys: string | string[], cb: () => void) => {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) delete stores.local[k];
            cb();
          }),
        },
        session: {
          get: vi.fn((keys: string | string[], cb: (o: Store) => void) => {
            const want = Array.isArray(keys) ? keys : [keys];
            const out: Store = {};
            for (const k of want) {
              if (k in stores.session) out[k] = stores.session[k];
            }
            cb(out);
          }),
          set: vi.fn((items: Store, cb: () => void) => {
            Object.assign(stores.session, items);
            cb();
          }),
          remove: vi.fn((keys: string | string[], cb: () => void) => {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) delete stores.session[k];
            cb();
          }),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies zeng.* to tajdin.* and removes legacy keys in local and session", async () => {
    const { ensureLegacyStorageMigrated } = await import("./storage-migration");
    await ensureLegacyStorageMigrated();

    expect(stores.local["tajdin.settings.v1"]).toEqual({ theme: "dark" });
    expect(stores.local["zeng.settings.v1"]).toBeUndefined();

    expect(stores.session["tajdin.session.ui.v1"]).toEqual({ activeTab: "browse" });
    expect(stores.session["zeng.session.ui.v1"]).toBeUndefined();
  });

  it("does not overwrite an existing tajdin key", async () => {
    stores.local = {
      "tajdin.settings.v1": { theme: "light" },
      "zeng.settings.v1": { theme: "dark" },
    };
    stores.session = {};

    const { ensureLegacyStorageMigrated } = await import("./storage-migration");
    await ensureLegacyStorageMigrated();

    expect(stores.local["tajdin.settings.v1"]).toEqual({ theme: "light" });
    expect(stores.local["zeng.settings.v1"]).toEqual({ theme: "dark" });
  });
});
