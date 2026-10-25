import { parseStation, stationId, type Station } from '../model/station';
import { cleanText, compileRegex } from '../util/text';
import { fetchJson, literalHint, matchesQuery, type FetchLike, type StationSource } from './types';

interface LautStation {
  name: string;
  display_name?: string;
  page_url?: string;
  stream_url?: string;
  format?: string;
  description?: string;
  location?: string;
  genres?: string[];
  active?: boolean;
  images?: { station_120x120?: string; station_80x80?: string };
}

interface LautPage {
  total?: number;
  items?: LautStation[];
}

interface LautSearchPage {
  total?: number;
  results?: { items?: { station: LautStation }[] }[];
}

const API = 'https://api.laut.fm';

export function fromLautFm(raw: LautStation): Station | undefined {
  if (!raw?.name || !/^[a-z0-9_-]+$/i.test(raw.name) || raw.active === false) return undefined;
  return parseStation({
    id: stationId('lautfm', raw.name),
    source: 'lautfm',
    name: cleanText(raw.display_name || raw.name),
    streamUrl: raw.stream_url ?? `https://stream.laut.fm/${raw.name}`,
    homepage: raw.page_url,
    favicon: raw.images?.station_120x120 ?? raw.images?.station_80x80,
    description: cleanText(raw.description || raw.format, 2000) || undefined,
    country: raw.location ? cleanText(raw.location, 100) : undefined,
    tags: (raw.genres ?? [])
      .slice(0, 12)
      .map((g) => cleanText(g, 40).toLowerCase())
      .filter(Boolean),
    codec: 'MP3',
  });
}

const toStations = (rows: LautStation[]) =>
  rows.flatMap((row) => {
    const station = fromLautFm(row);
    return station ? [station] : [];
  });

/** laut.fm: ~17k user-run stations with a free, open JSON API. It has no language data. */
export function createLautFmSource(fetcher: FetchLike = fetch.bind(globalThis)): StationSource {
  let total = 15000;

  return {
    id: 'lautfm',
    label: 'laut.fm',
    homepage: 'https://laut.fm/',
    hasLanguages: false,

    async search(query, signal) {
      if (query.language) return { stations: [], hasMore: false };
      const regex = query.mode === 'regex' ? compileRegex(query.text) : null;
      const text = query.mode === 'regex' ? literalHint(query.text) : query.text;
      if (!text) {
        const page = await fetchJson<LautPage>(
          fetcher,
          `${API}/stations?limit=${query.limit}&offset=${query.offset}`,
          signal,
        );
        const stations = toStations(page.items ?? []).filter((s) => matchesQuery(s, query, regex));
        return { stations, hasMore: (page.items?.length ?? 0) >= query.limit };
      }
      const page = await fetchJson<LautSearchPage>(
        fetcher,
        `${API}/search/stations?query=${encodeURIComponent(text)}&limit=${query.limit}&offset=${query.offset}`,
        signal,
      );
      const rows = (page.results ?? []).flatMap((r) => (r.items ?? []).map((i) => i.station));
      return {
        stations: toStations(rows).filter((s) => matchesQuery(s, query, regex)),
        hasMore: rows.length >= query.limit,
      };
    },

    async random(query, signal) {
      if (query.language) return [];
      const offset = Math.floor(Math.random() * Math.max(1, total - query.count));
      const page = await fetchJson<LautPage>(
        fetcher,
        `${API}/stations?limit=${query.count}&offset=${offset}`,
        signal,
      );
      if (typeof page.total === 'number' && page.total > 0) total = page.total;
      return toStations(page.items ?? []);
    },

    async getByIds(ids, signal) {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetchJson<LautStation>(fetcher, `${API}/station/${encodeURIComponent(id)}`, signal),
        ),
      );
      return toStations(results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])));
    },

    async nowPlaying(station, signal) {
      const name = station.id.slice('laut:'.length);
      const song = await fetchJson<{ title?: string; artist?: { name?: string } }>(
        fetcher,
        `${API}/station/${encodeURIComponent(name)}/current_song`,
        signal,
      );
      const title = cleanText(song.title, 200);
      return title ? { title, artist: cleanText(song.artist?.name, 200) || undefined } : undefined;
    },
  };
}
