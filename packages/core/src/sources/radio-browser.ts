import { normaliseLanguage, radioBrowserLanguageName } from '../model/languages';
import { parseStation, stationId, type Station } from '../model/station';
import { cleanText, compileRegex, splitList } from '../util/text';
import {
  fetchJson,
  literalHint,
  matchesQuery,
  SourceError,
  type FetchLike,
  type RandomQuery,
  type SearchQuery,
  type StationSource,
} from './types';

export const RADIO_BROWSER_HOSTS = [
  'https://all.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://fi1.api.radio-browser.info',
] as const;

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
/** Radio Browser is a volunteer service; keep a polite gap between requests. */
const MIN_INTERVAL_MS = 400;

export interface RadioBrowserRow {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  countrycode?: string;
  language?: string;
  languagecodes?: string;
  codec?: string;
  bitrate?: number;
  hls?: number;
  lastcheckok?: number;
}

export function fromRadioBrowser(row: RadioBrowserRow): Station | undefined {
  if (!row || typeof row.stationuuid !== 'string') return undefined;
  const languages = new Set<string>();
  for (const code of splitList(row.languagecodes)) languages.add(normaliseLanguage(code));
  for (const name of splitList(row.language)) languages.add(normaliseLanguage(name));
  languages.delete('');
  return parseStation({
    id: stationId('radio-browser', row.stationuuid),
    source: 'radio-browser',
    name: cleanText(row.name),
    streamUrl: row.url_resolved || row.url,
    homepage: row.homepage,
    favicon: row.favicon,
    country: cleanText(row.country, 100) || undefined,
    countryCode: cleanText(row.countrycode, 4).toUpperCase() || undefined,
    languages: [...languages].slice(0, 12),
    tags: splitList(row.tags),
    codec: cleanText(row.codec, 20) || undefined,
    bitrate:
      typeof row.bitrate === 'number' && row.bitrate > 0 ? Math.round(row.bitrate) : undefined,
    hls: row.hls === 1,
  });
}

export function createRadioBrowserSource(
  fetcher: FetchLike = fetch.bind(globalThis),
): StationSource {
  let lastRequest = 0;
  let queue: Promise<unknown> = Promise.resolve();

  /** Serialises requests with a minimum gap and fails over across mirrors. */
  function request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const run = async () => {
      const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      let lastError: unknown;
      for (const host of RADIO_BROWSER_HOSTS) {
        signal?.throwIfAborted();
        lastRequest = Date.now();
        try {
          return await fetchJson<T>(fetcher, `${host}${path}`, signal);
        } catch (error) {
          if (signal?.aborted) throw error;
          const status = (error as { status?: number }).status;
          if (status !== undefined && !RETRYABLE.has(status)) throw error;
          lastError = error;
        }
      }
      throw new SourceError('radio-browser', `Radio Browser is unreachable (${String(lastError)})`);
    };
    const next = queue.then(run, run);
    queue = next.catch(() => undefined);
    return next;
  }

  const toStations = (rows: RadioBrowserRow[]) =>
    rows.flatMap((row) => {
      const station = fromRadioBrowser(row);
      return station ? [station] : [];
    });

  function params(base: Record<string, string | number | boolean | undefined>) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== '') p.set(k, String(v));
    return p.toString();
  }

  return {
    id: 'radio-browser',
    label: 'Radio Browser',
    homepage: 'https://www.radio-browser.info/',
    hasLanguages: true,

    async search(query, signal) {
      const regex = query.mode === 'regex' ? compileRegex(query.text) : null;
      const name = query.mode === 'regex' ? literalHint(query.text) : query.text;
      const searching = !!query.text;
      const qs = params({
        name: name || undefined,
        language: query.language ? radioBrowserLanguageName(query.language) : undefined,
        bitrateMin: query.minBitrate || undefined,
        is_https: query.httpsOnly || undefined,
        hidebroken: query.hideBroken,
        order: searching ? 'clickcount' : 'random',
        reverse: searching ? true : undefined,
        offset: query.offset,
        limit: query.limit,
      });
      const rows = await request<RadioBrowserRow[]>(`/json/stations/search?${qs}`, signal);
      return {
        stations: toStations(rows).filter((s) => matchesQuery(s, query, regex)),
        hasMore: rows.length >= query.limit,
      };
    },

    async random(query: RandomQuery, signal) {
      const page = await this.search(
        {
          ...query,
          text: '',
          mode: 'exact',
          offset: 0,
          limit: query.count,
          minBitrate: 0,
        } satisfies SearchQuery,
        signal,
      );
      return page.stations;
    },

    async getByIds(ids, signal) {
      const out: Station[] = [];
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const rows = await request<RadioBrowserRow[]>(
          `/json/stations/byuuid?uuids=${chunk.map(encodeURIComponent).join(',')}`,
          signal,
        );
        out.push(...toStations(rows));
      }
      return out;
    },

    reportPlay(station) {
      const uuid = station.id.slice('rb:'.length);
      void request(`/json/url/${encodeURIComponent(uuid)}`).catch(() => undefined);
    },
  };
}
