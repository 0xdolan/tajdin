import type { z } from "zod";
import type { ZodError } from "zod";
import { parseWithSchema, type ParseResult } from "../types/validate";

export type StorageGetResult<T> =
  | ParseResult<T>
  | { success: true; missing: true };

export class StorageValidationError extends Error {
  readonly key: string;
  readonly formatted: string;
  readonly zodError: ZodError;

  constructor(key: string, formatted: string, zodError: ZodError) {
    super(`Storage key "${key}" failed validation: ${formatted}`);
    this.name = "StorageValidationError";
    this.key = key;
    this.formatted = formatted;
    this.zodError = zodError;
  }
}

export type GetWithDefaultOptions = {
  /**
   * When a value is present but does not match the schema.
   * - `throw` — {@link StorageValidationError} (default)
   * - `default` — return the provided default (data may be stale in storage)
   */
  onInvalidStored?: "throw" | "default";
};

/** Normalized shape (Chrome `StorageChange` is compatible). */
export type StorageChangeRecord = {
  oldValue?: unknown;
  newValue?: unknown;
};

export type StorageWatchEvent<T> =
  | { kind: "updated"; data: T }
  | { kind: "removed" }
  | { kind: "invalid"; formatted: string; error: ZodError };

/**
 * Testable surface for `chrome.storage` read/write (callback API promisified).
 */
export interface StorageAreaAdapter {
  get(keys: string | string[] | null | undefined): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  /**
   * Subscribe to changes for this logical area. Required for {@link ChromeStorageWrapper.watch}.
   */
  addStorageListener?(listener: (changes: Record<string, StorageChangeRecord>) => void): () => void;
}

const chromeSubscribers = {
  local: new Set<(changes: Record<string, StorageChangeRecord>) => void>(),
  session: new Set<(changes: Record<string, StorageChangeRecord>) => void>(),
} as const;

const chromeHookInstalled = { local: false, session: false };

function ensureChromeOnChangedHook(areaName: "local" | "session"): void {
  if (chromeHookInstalled[areaName]) return;
  chromeHookInstalled[areaName] = true;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== areaName) return;
    const subs = chromeSubscribers[areaName];
    for (const cb of [...subs]) {
      cb(changes as Record<string, StorageChangeRecord>);
    }
  });
}

export function chromeStorageAreaAdapter(
  area: chrome.storage.StorageArea,
  areaName: "local" | "session",
): StorageAreaAdapter {
  return {
    get(keys) {
      return new Promise((resolve, reject) => {
        area.get(keys ?? null, (items) => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve(items as Record<string, unknown>);
        });
      });
    },
    set(items) {
      return new Promise((resolve, reject) => {
        area.set(items, () => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve();
        });
      });
    },
    remove(keys) {
      return new Promise((resolve, reject) => {
        area.remove(keys, () => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          resolve();
        });
      });
    },
    addStorageListener(listener) {
      ensureChromeOnChangedHook(areaName);
      chromeSubscribers[areaName].add(listener);
      return () => {
        chromeSubscribers[areaName].delete(listener);
      };
    },
  };
}

/**
 * Generic, schema-backed access to a storage area (local or session).
 */
export class ChromeStorageWrapper<TSchema extends z.ZodTypeAny> {
  constructor(
    private readonly area: StorageAreaAdapter,
    private readonly schema: TSchema,
  ) {}

  async get(key: string): Promise<StorageGetResult<z.infer<TSchema>>> {
    const items = await this.area.get(key);
    if (!(key in items) || items[key] === undefined) {
      return { success: true, missing: true };
    }
    return parseWithSchema(this.schema, items[key]);
  }

  async set(key: string, value: unknown): Promise<ParseResult<z.infer<TSchema>>> {
    const parsed = parseWithSchema(this.schema, value);
    if (!parsed.success) {
      return parsed;
    }
    await this.area.set({ [key]: parsed.data });
    return parsed;
  }

  async remove(key: string): Promise<void> {
    await this.area.remove([key]);
  }

  /**
   * Like {@link get}, but returns `defaultValue` when the key is missing.
   * When stored JSON is present and invalid, behavior is controlled by `options.onInvalidStored`.
   */
  async getWithDefault(
    key: string,
    defaultValue: z.infer<TSchema>,
    options?: GetWithDefaultOptions,
  ): Promise<z.infer<TSchema>> {
    const r = await this.get(key);
    if (r.success && "missing" in r && r.missing) {
      return defaultValue;
    }
    if (r.success && "data" in r) {
      return r.data;
    }
    if (!r.success) {
      const mode = options?.onInvalidStored ?? "throw";
      if (mode === "default") {
        return defaultValue;
      }
      throw new StorageValidationError(key, r.formatted, r.error);
    }
    return defaultValue;
  }

  /**
   * Listen for `chrome.storage` updates to `key` in this adapter’s area.
   * New values are validated before `updated` is emitted.
   */
  watch(key: string, handler: (event: StorageWatchEvent<z.infer<TSchema>>) => void): () => void {
    const add = this.area.addStorageListener;
    if (!add) {
      throw new Error(
        "ChromeStorageWrapper.watch requires StorageAreaAdapter.addStorageListener (e.g. chromeStorageAreaAdapter or a test adapter that implements it).",
      );
    }
    return add((changes) => {
      if (!(key in changes)) return;
      const ch = changes[key]!;
      if (ch.newValue === undefined) {
        handler({ kind: "removed" });
        return;
      }
      const parsed = parseWithSchema(this.schema, ch.newValue);
      if (!parsed.success) {
        handler({ kind: "invalid", formatted: parsed.formatted, error: parsed.error });
        return;
      }
      handler({ kind: "updated", data: parsed.data });
    });
  }
}
