import rows from '../data/kurdish-stations.json' with { type: 'json' };
import { parseStation, stationId, type Station } from '../model/station';
import { cleanText, compileRegex } from '../util/text';
import { sample } from '../util/random';
import { matchesQuery, type StationSource } from './types';

interface CuratedRow {
  id: string;
  name: string;
  url: string;
  cover?: string;
}

/**
 * Hand-maintained Kurdish stations, bundled with the app. Edit
 * `packages/core/src/data/kurdish-stations.json` to add or fix one (see docs/contributing.md).
 */
export const CURATED_STATIONS: readonly Station[] = (rows as CuratedRow[]).flatMap((row) => {
  const station = parseStation({
    id: stationId('curated', row.id),
    source: 'curated',
    name: cleanText(row.name),
    streamUrl: row.url,
    favicon: row.cover || undefined,
    languages: ['ku'],
    tags: ['kurdish'],
  });
  return station ? [station] : [];
});

const byNativeId = new Map(CURATED_STATIONS.map((s) => [s.id.slice('ku:'.length), s]));

export function createCuratedSource(): StationSource {
  const inLanguage = (language: string) => !language || language === 'ku';
  return {
    id: 'curated',
    label: 'Tajdîn Kurdish list',
    homepage: 'https://github.com/0xdolan/tajdin/blob/main/packages/core/src/data/kurdish-stations.json',
    hasLanguages: true,

    async search(query) {
      if (!inLanguage(query.language)) return { stations: [], hasMore: false };
      const regex = query.mode === 'regex' ? compileRegex(query.text) : null;
      const matches = CURATED_STATIONS.filter((s) => matchesQuery(s, query, regex));
      return {
        stations: matches.slice(query.offset, query.offset + query.limit),
        hasMore: query.offset + query.limit < matches.length,
      };
    },

    async random(query) {
      if (!inLanguage(query.language)) return [];
      const pool = query.httpsOnly ? CURATED_STATIONS.filter((s) => s.streamUrl.startsWith('https://')) : CURATED_STATIONS;
      return sample(pool, query.count);
    },

    async getByIds(ids) {
      return ids.flatMap((id) => {
        const station = byNativeId.get(id);
        return station ? [station] : [];
      });
    },
  };
}
