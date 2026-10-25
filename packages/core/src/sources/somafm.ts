import { parseStation, stationId, type Station } from '../model/station';
import { cleanText, compileRegex, splitList } from '../util/text';
import { sample } from '../util/random';
import { fetchJson, matchesQuery, type FetchLike, type StationSource } from './types';

interface SomaChannel {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  image?: string;
  largeimage?: string;
}

const CHANNELS_URL = 'https://somafm.com/channels.json';
const CACHE_MS = 30 * 60 * 1000;

export function fromSomaFm(channel: SomaChannel): Station | undefined {
  if (!channel?.id || !/^[a-z0-9]+$/i.test(channel.id)) return undefined;
  return parseStation({
    id: stationId('somafm', channel.id),
    source: 'somafm',
    name: `SomaFM ${cleanText(channel.title)}`,
    streamUrl: `https://ice2.somafm.com/${channel.id}-128-mp3`,
    homepage: `https://somafm.com/${channel.id}/`,
    favicon: channel.largeimage || channel.image,
    description: cleanText(channel.description, 2000) || undefined,
    country: 'United States',
    countryCode: 'US',
    languages: ['en'],
    tags: splitList(channel.genre?.replace(/\|/g, ',')),
    codec: 'MP3',
    bitrate: 128,
  });
}

/** SomaFM: ~50 listener-supported, ad-free channels. The whole catalogue is one small JSON file. */
export function createSomaFmSource(fetcher: FetchLike = fetch.bind(globalThis)): StationSource {
  let cache: { at: number; stations: Station[] } | undefined;

  async function all(signal?: AbortSignal) {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.stations;
    const data = await fetchJson<{ channels: SomaChannel[] }>(fetcher, CHANNELS_URL, signal);
    const stations = (data.channels ?? []).flatMap((c) => {
      const s = fromSomaFm(c);
      return s ? [s] : [];
    });
    cache = { at: Date.now(), stations };
    return stations;
  }

  const inLanguage = (language: string) => !language || language === 'en';

  return {
    id: 'somafm',
    label: 'SomaFM',
    homepage: 'https://somafm.com/',
    hasLanguages: true,

    async search(query, signal) {
      if (!inLanguage(query.language) || (query.minBitrate && query.minBitrate > 128)) {
        return { stations: [], hasMore: false };
      }
      const regex = query.mode === 'regex' ? compileRegex(query.text) : null;
      const matches = (await all(signal)).filter((s) => matchesQuery(s, query, regex));
      return {
        stations: matches.slice(query.offset, query.offset + query.limit),
        hasMore: query.offset + query.limit < matches.length,
      };
    },

    async random(query, signal) {
      if (!inLanguage(query.language)) return [];
      return sample(await all(signal), query.count);
    },

    async getByIds(ids, signal) {
      const wanted = new Set(ids.map((id) => stationId('somafm', id)));
      return (await all(signal)).filter((s) => wanted.has(s.id));
    },

    async nowPlaying(station, signal) {
      const channel = station.id.slice('soma:'.length);
      const data = await fetchJson<{ songs?: { title?: string; artist?: string }[] }>(
        fetcher,
        `https://somafm.com/songs/${encodeURIComponent(channel)}.json`,
        signal,
      );
      const song = data.songs?.[0];
      const title = cleanText(song?.title, 200);
      return title ? { title, artist: cleanText(song?.artist, 200) || undefined } : undefined;
    },
  };
}
