import type { z } from "zod";
import { parseWithSchema, type ParseResult } from "../types/validate";

export type StorageGetResult<T> =
  | ParseResult<T>
  | { success: true; missing: true };

/**
 * Testable surface for `chrome.storage` read/write (callback API promisified).
 */
export interface StorageAreaAdapter {
  get(keys: string | string[] | null | undefined): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export function chromeStorageAreaAdapter(area: chrome.storage.StorageArea): StorageAreaAdapter {
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
}
