import type { Group, Library } from '../model/library';
import { nativeIdOf, sourceOf, type DirectorySourceId, type Station } from '../model/station';
import { interleave } from '../util/random';
import { createCuratedSource } from './curated';
import { createLautFmSource } from './lautfm';
import { createRadioBrowserSource } from './radio-browser';
import { createSomaFmSource } from './somafm';
import type { FetchLike, NowPlaying, SearchQuery, StationSource } from './types';

export interface CatalogOptions {
  fetch?: FetchLike;
  /** Web build: the page is served over https, so http streams would be blocked as mixed content. */
  httpsOnly?: boolean;
}

export interface MixOptions {
  sources: readonly DirectorySourceId[];
  language: string;
  count: number;
  hideBroken: boolean;
}

export type SearchOptions = Omit<SearchQuery, 'offset' | 'limit' | 'httpsOnly'> & {
  sources: readonly DirectorySourceId[];
  pageSize?: number;
};

export interface SearchSession {
  /** Loads the next page across all sources; resolves to an empty array when everything is exhausted. */
  next(signal?: AbortSignal): Promise<Station[]>;
  readonly done: boolean;
  /** Per-source errors from the last page. A failing directory doesn't break the others. */
  readonly errors: ReadonlyMap<DirectorySourceId, Error>;
}

export type Catalog = ReturnType<typeof createCatalog>;

export function createCatalog(options: CatalogOptions = {}) {
  const httpsOnly = options.httpsOnly ?? false;
  const sources: Record<DirectorySourceId, StationSource> = {
    curated: createCuratedSource(),
    'radio-browser': createRadioBrowserSource(options.fetch),
    somafm: createSomaFmSource(options.fetch),
    lautfm: createLautFmSource(options.fetch),
  };

  const usable = (ids: readonly DirectorySourceId[], language: string) =>
    ids.map((id) => sources[id]).filter((s) => !language || s.hasLanguages);

  /** Removes duplicates by ID and by stream URL (the same stream is often listed in several directories). */
  function dedupe(stations: Station[]): Station[] {
    const ids = new Set<string>();
    const urls = new Set<string>();
    return stations.filter((s) => {
      const url = s.streamUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (ids.has(s.id) || urls.has(url)) return false;
      ids.add(s.id);
      urls.add(url);
      return true;
    });
  }

  return {
    sources,
    httpsOnly,

    /** A fresh, varied set of stations for the start screen. */
    async mix({ sources: ids, language, count, hideBroken }: MixOptions, signal?: AbortSignal) {
      const active = usable(ids, language);
      const per = Math.max(4, Math.ceil(count / Math.max(1, active.length)));
      const results = await Promise.allSettled(
        active.map((s) => {
          // When Kurdish is chosen the curated list is the point, so it gets more room.
          const n =
            s.id === 'curated' && (language === 'ku' || !language) ? Math.max(per, 12) : per;
          return s.random({ count: n, language, hideBroken, httpsOnly }, signal);
        }),
      );
      const lists = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
      if (results.every((r) => r.status === 'rejected')) {
        throw (
          (results[0] as PromiseRejectedResult | undefined)?.reason ??
          new Error('No sources available')
        );
      }
      return dedupe(interleave(lists)).slice(0, count);
    },

    search(opts: SearchOptions): SearchSession {
      const pageSize = opts.pageSize ?? 30;
      const state = usable(opts.sources, opts.language).map((source) => ({
        source,
        offset: 0,
        done: false,
      }));
      const seen = new Set<string>();
      const errors = new Map<DirectorySourceId, Error>();
      return {
        get done() {
          return state.every((s) => s.done);
        },
        errors,
        async next(signal) {
          errors.clear();
          const pending = state.filter((s) => !s.done);
          const results = await Promise.allSettled(
            pending.map((s) =>
              s.source.search({ ...opts, offset: s.offset, limit: pageSize, httpsOnly }, signal),
            ),
          );
          const lists: Station[][] = [];
          results.forEach((result, i) => {
            const entry = pending[i]!;
            if (result.status === 'rejected') {
              entry.done = true;
              errors.set(entry.source.id, result.reason as Error);
              return;
            }
            entry.offset += pageSize;
            entry.done = !result.value.hasMore;
            lists.push(result.value.stations);
          });
          return interleave(lists).filter((s) => !seen.has(s.id) && seen.add(s.id));
        },
      };
    },

    /**
     * Turns library IDs into stations, keeping their order. Custom stations and the curated list
     * resolve locally, others come from the station cache, and only the rest go to the network.
     */
    async resolve(ids: readonly string[], library: Library, signal?: AbortSignal) {
      const known = new Map<string, Station>();
      for (const s of library.customStations) known.set(s.id, s);
      for (const [id, s] of Object.entries(library.stationCache)) known.set(id, s);
      const missing = new Map<DirectorySourceId, string[]>();
      for (const id of ids) {
        if (known.has(id)) continue;
        const source = sourceOf(id);
        if (source && source in sources) {
          const list = missing.get(source as DirectorySourceId) ?? [];
          list.push(nativeIdOf(id));
          missing.set(source as DirectorySourceId, list);
        }
      }
      const fetched: Station[] = [];
      await Promise.allSettled(
        [...missing].map(async ([source, nativeIds]) => {
          const stations = await sources[source].getByIds(nativeIds, signal);
          fetched.push(...stations);
        }),
      );
      for (const s of fetched) known.set(s.id, s);
      return {
        stations: ids.flatMap((id) => {
          const s = known.get(id);
          return s ? [s] : [];
        }),
        /** Newly fetched stations, for the caller to store in the station cache. */
        fetched,
      };
    },

    /** Stations of a language group: the pinned ones first, then directory results. */
    groupSearch(
      group: Extract<Group, { kind: 'language' }>,
      opts: Omit<SearchOptions, 'language'>,
    ) {
      return this.search({ ...opts, language: group.language });
    },

    async nowPlaying(station: Station, signal?: AbortSignal): Promise<NowPlaying | undefined> {
      const source = sourceOf(station.id);
      if (!source || !(source in sources)) return undefined;
      return sources[source as DirectorySourceId].nowPlaying?.(station, signal);
    },

    hasDirectoryNowPlaying(station: Station) {
      const source = sourceOf(station.id);
      return !!source && source in sources && !!sources[source as DirectorySourceId].nowPlaying;
    },

    reportPlay(station: Station) {
      if (station.source === 'radio-browser') sources['radio-browser'].reportPlay?.(station);
    },
  };
}
