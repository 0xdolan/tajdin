import { StationSchema, type Station } from "../types/station";

/** Primary + fallback API hosts (FR-001). Paths are appended per call. */
export const DEFAULT_RADIO_BROWSER_BASES = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
] as const;

const SEARCH_PATH = "/json/stations/search";
const BYUUID_PATH = "/json/stations/byuuid/";

export type StationSearchParams = {
  name?: string;
  tag?: string;
  language?: string;
  country?: string;
  countrycode?: string;
  codec?: string;
  /** Page size; Radio Browser defaults vary — Tajdîn uses 50 (PRD). */
  limit?: number;
  offset?: number;
  /** e.g. `clickcount`, `random` (Radio Browser search). */
  order?: string;
  reverse?: boolean;
};

export type RadioBrowserClientOptions = {
  /** Override API roots (each without trailing slash). */
  bases?: readonly string[];
  /** Minimum spacing between the start of consecutive requests (ms). */
  minIntervalMs?: number;
  fetch?: typeof fetch;
};

export class RadioBrowserRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RadioBrowserRequestError";
  }
}

function shouldRetryHttpStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 500;
}

function buildSearchQuery(params: StationSearchParams): string {
  const q = new URLSearchParams();
  const limit = params.limit ?? 50;
  q.set("limit", String(limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.name !== undefined) q.set("name", params.name);
  if (params.tag !== undefined) q.set("tag", params.tag);
  if (params.language !== undefined) q.set("language", params.language);
  if (params.country !== undefined) q.set("country", params.country);
  if (params.countrycode !== undefined) q.set("countrycode", params.countrycode);
  if (params.codec !== undefined) q.set("codec", params.codec);
  if (params.order !== undefined) q.set("order", params.order);
  if (params.reverse === true) q.set("reverse", "true");
  return q.toString();
}

/**
 * Maps a JSON row to {@link Station}, or `null` if it fails validation.
 */
export function mapApiStationRow(raw: unknown): Station | null {
  const r = StationSchema.safeParse(raw);
  return r.success ? r.data : null;
}

function parseStationArray(payload: unknown): Station[] {
  if (!Array.isArray(payload)) {
    throw new RadioBrowserRequestError("Expected JSON array of stations");
  }
  const out: Station[] = [];
  for (const row of payload) {
    const s = mapApiStationRow(row);
    if (s) out.push(s);
  }
  return out;
}

function createInterRequestDelayer(intervalMs: number) {
  let lastEnd = 0;
  let chain: Promise<void> = Promise.resolve();

  return function runQueued<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, lastEnd + intervalMs - now);
      if (wait > 0) {
        await new Promise<void>((r) => setTimeout(r, wait));
      }
      try {
        return await fn();
      } finally {
        lastEnd = Date.now();
      }
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

export class RadioBrowserClient {
  private readonly bases: readonly string[];
  private readonly runQueued: <T>(fn: () => Promise<T>) => Promise<T>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RadioBrowserClientOptions = {}) {
    this.bases = options.bases?.length ? options.bases : DEFAULT_RADIO_BROWSER_BASES;
    const gap = options.minIntervalMs ?? 400;
    this.runQueued = gap > 0 ? createInterRequestDelayer(gap) : (fn) => fn();
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Search stations. Tries each base in order until a response succeeds.
   * Retries the next base on network errors, 5xx, and 429.
   */
  async searchStations(params: StationSearchParams = {}): Promise<Station[]> {
    const query = buildSearchQuery(params);
    let lastError: unknown;

    return this.runQueued(async () => {
      for (const base of this.bases) {
        const url = `${base}${SEARCH_PATH}?${query}`;
        try {
          const res = await this.fetchImpl(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            if (shouldRetryHttpStatus(res.status)) {
              lastError = new RadioBrowserRequestError(
                `HTTP ${res.status} from ${base}`,
                res.status,
              );
              continue;
            }
            throw new RadioBrowserRequestError(
              `HTTP ${res.status} from ${base}`,
              res.status,
            );
          }
          let json: unknown;
          try {
            json = await res.json();
          } catch (e) {
            lastError = e;
            continue;
          }
          return parseStationArray(json);
        } catch (e) {
          if (e instanceof RadioBrowserRequestError && e.status !== undefined && !shouldRetryHttpStatus(e.status)) {
            throw e;
          }
          lastError = e;
        }
      }

      const msg =
        lastError instanceof Error ? lastError.message : "All Radio Browser endpoints failed";
      throw new RadioBrowserRequestError(msg, undefined, lastError);
    });
  }

  /**
   * Resolve a single station by `stationuuid` (Radio Browser `byuuid` endpoint).
   */
  async fetchStationByUuid(stationuuid: string): Promise<Station | null> {
    const id = stationuuid.trim();
    if (!id) return null;
    const pathSuffix = `${BYUUID_PATH}${encodeURIComponent(id)}`;
    let lastError: unknown;

    return this.runQueued(async () => {
      for (const base of this.bases) {
        const url = `${base}${pathSuffix}`;
        try {
          const res = await this.fetchImpl(url, {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            if (shouldRetryHttpStatus(res.status)) {
              lastError = new RadioBrowserRequestError(
                `HTTP ${res.status} from ${base}`,
                res.status,
              );
              continue;
            }
            if (res.status === 404) {
              return null;
            }
            throw new RadioBrowserRequestError(
              `HTTP ${res.status} from ${base}`,
              res.status,
            );
          }
          let json: unknown;
          try {
            json = await res.json();
          } catch (e) {
            lastError = e;
            continue;
          }
          if (!Array.isArray(json) || json.length === 0) {
            return null;
          }
          return mapApiStationRow(json[0]);
        } catch (e) {
          if (e instanceof RadioBrowserRequestError && e.status !== undefined && !shouldRetryHttpStatus(e.status)) {
            throw e;
          }
          lastError = e;
        }
      }

      const msg =
        lastError instanceof Error ? lastError.message : "All Radio Browser endpoints failed";
      throw new RadioBrowserRequestError(msg, undefined, lastError);
    });
  }
}

/** Default client: primary + fallback hosts and ~400 ms between requests. */
export const defaultRadioBrowserClient = new RadioBrowserClient();
