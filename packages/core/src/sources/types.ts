import type { DirectorySourceId, Station } from '../model/station';

export interface SearchQuery {
  /** Free text, already cleaned. Empty means "no search". */
  text: string;
  mode: 'exact' | 'regex';
  /** Normalised language code; empty for all languages. */
  language: string;
  offset: number;
  limit: number;
  hideBroken: boolean;
  /** Minimum bitrate in kbps; 0 for any. */
  minBitrate: number;
  /** Only return stations reachable over https (the web build can't play http streams). */
  httpsOnly: boolean;
}

export interface SearchPage {
  stations: Station[];
  hasMore: boolean;
}

export interface RandomQuery {
  count: number;
  language: string;
  hideBroken: boolean;
  httpsOnly: boolean;
}

export interface NowPlaying {
  title: string;
  artist?: string;
}

export interface StationSource {
  id: DirectorySourceId;
  label: string;
  homepage: string;
  /** Whether results can be narrowed by language. Sources without language data are skipped then. */
  hasLanguages: boolean;
  search(query: SearchQuery, signal?: AbortSignal): Promise<SearchPage>;
  random(query: RandomQuery, signal?: AbortSignal): Promise<Station[]>;
  /** Re-fetches stations by their native IDs (without the `rb:`-style prefix). */
  getByIds(nativeIds: string[], signal?: AbortSignal): Promise<Station[]>;
  /** Song information from the directory itself, for stations whose streams don't carry it. */
  nowPlaying?(station: Station, signal?: AbortSignal): Promise<NowPlaying | undefined>;
  /** Tell the directory a station was played (Radio Browser asks clients to do this). */
  reportPlay?(station: Station): void;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class SourceError extends Error {
  constructor(
    readonly source: DirectorySourceId,
    message: string,
  ) {
    super(message);
    this.name = 'SourceError';
  }
}

export async function fetchJson<T>(
  fetcher: FetchLike,
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetcher(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
  return (await res.json()) as T;
}

/** Applies the client-side half of a search: regex matching and the https filter. */
export function matchesQuery(
  station: Station,
  query: Pick<SearchQuery, 'text' | 'mode' | 'httpsOnly'>,
  regex: RegExp | null,
): boolean {
  if (query.httpsOnly && !station.streamUrl.startsWith('https://')) return false;
  if (!query.text) return true;
  if (query.mode === 'regex') return regex ? regex.test(station.name) : false;
  const needle = query.text.toLowerCase();
  return (
    station.name.toLowerCase().includes(needle) ||
    station.tags.some((t) => t.includes(needle)) ||
    (station.description?.toLowerCase().includes(needle) ?? false)
  );
}

/**
 * The longest literal run in a regex, used as a server-side name hint so regex search still
 * narrows large directories. `^radio\s+(kurd|kurdistan)` → "radio".
 */
export function literalHint(pattern: string): string {
  // A single linear pass (the pattern is user input): escapes and metacharacters end a run.
  const META = new Set(['^', '$', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|']);
  const runs: string[] = [];
  let run = '';
  const flush = () => {
    if (run.length >= 2) runs.push(run);
    run = '';
  };
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === '\\') {
      flush();
      const next = pattern[i + 1];
      // \p{…} / \P{…} / \u{…}: skip to the closing brace.
      if ((next === 'p' || next === 'P' || next === 'u') && pattern[i + 2] === '{') {
        const close = pattern.indexOf('}', i + 3);
        i = close < 0 ? pattern.length : close;
      } else {
        i++;
      }
    } else if (META.has(ch) || /\s/.test(ch)) {
      flush();
    } else {
      run += ch;
    }
  }
  flush();
  return runs.sort((a, b) => b.length - a.length)[0] ?? '';
}
