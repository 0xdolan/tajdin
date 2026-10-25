import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CURATED_STATIONS,
  compileRegex,
  languageLabel,
  matchesQuery,
  rememberStations,
  type Group,
  type Library,
  type QueueContext,
  type SearchSession,
  type Settings,
  type Station,
} from '@tajdin/core';
import { useLibrary, useSettings } from './data';
import { usePlatform } from './platform';

export type View =
  | { kind: 'mix'; language: string }
  | { kind: 'search'; text: string; mode: 'exact' | 'regex'; language: string }
  | { kind: 'favourites' }
  | { kind: 'playlist'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'language'; language: string }
  | { kind: 'custom' };

export interface Feed {
  stations: Station[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  reload: () => void;
  context: QueueContext;
}

const MIX_SIZE = 40;

interface LoadResult {
  key: string;
  status: 'ready' | 'error';
  stations: Station[];
  error: string | null;
  hasMore: boolean;
}

export function viewLabel(view: View, library: Library): string {
  switch (view.kind) {
    case 'mix':
      return view.language ? `Random · ${languageLabel(view.language)}` : 'Random mix';
    case 'search':
      return `Search “${view.text}”`;
    case 'favourites':
      return 'Favourites';
    case 'playlist':
      return library.playlists.find((p) => p.id === view.id)?.name ?? 'Playlist';
    case 'group':
      return library.groups.find((g) => g.id === view.id)?.name ?? 'Group';
    case 'language':
      return languageLabel(view.language);
    case 'custom':
      return 'My stations';
  }
}

/** Turns the start-view setting into a view. Missing playlists or groups fall back to the mix. */
export function startViewToView(settings: Settings, library: Library): View {
  const sv = settings.startView;
  switch (sv.kind) {
    case 'favourites':
      return { kind: 'favourites' };
    case 'language':
      return { kind: 'language', language: sv.language };
    case 'playlist':
      return library.playlists.some((p) => p.id === sv.id)
        ? { kind: 'playlist', id: sv.id }
        : { kind: 'mix', language: '' };
    case 'group':
      return library.groups.some((g) => g.id === sv.id)
        ? { kind: 'group', id: sv.id }
        : { kind: 'mix', language: '' };
    default:
      return { kind: 'mix', language: settings.defaultLanguage };
  }
}

/**
 * Loads the stations for a view. Library views resolve their IDs (locally first, then the
 * directories); directory views page through all enabled sources. `filter` narrows the
 * loaded list on the client (used by the library views' quick filter).
 */
export function useStationFeed(view: View, filter = ''): Feed {
  const { catalog } = usePlatform();
  const [settings] = useSettings();
  const [library, updateLibrary, libraryReady] = useLibrary();
  /** The last finished load, tagged with the request it answers; a newer request means "loading". */
  const [result, setResult] = useState<LoadResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nonce, setNonce] = useState(0);
  const session = useRef<SearchSession | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Loads read the latest library without re-running on every unrelated library change.
  const libraryRef = useRef(library);
  useEffect(() => {
    libraryRef.current = library;
  });

  // Library views re-run when the referenced IDs change; directory views don't depend on the library.
  const libraryKey = useMemo(() => {
    if (view.kind === 'favourites') return library.favourites.join(',');
    if (view.kind === 'playlist')
      return library.playlists.find((p) => p.id === view.id)?.stationIds.join(',') ?? '';
    if (view.kind === 'group') {
      const g = library.groups.find((x) => x.id === view.id);
      return g
        ? `${g.kind}:${g.kind === 'language' ? g.language : ''}:${g.stationIds.join(',')}`
        : '';
    }
    if (view.kind === 'custom')
      return library.customStations.map((s) => `${s.id}:${s.name}:${s.streamUrl}`).join(',');
    return '';
  }, [view, library]);

  const viewKey = JSON.stringify(view);
  const sourcesKey = settings.sources.join(',');
  const requestKey = [
    viewKey,
    libraryKey,
    sourcesKey,
    settings.hideBroken,
    settings.preferredBitrate,
    nonce,
  ].join('|');

  useEffect(() => {
    if (!libraryReady) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const { signal } = controller;
    const lib = libraryRef.current;
    session.current = null;

    const searchOpts = {
      sources: settings.sources,
      hideBroken: settings.hideBroken,
      minBitrate: settings.preferredBitrate === 'auto' ? 0 : settings.preferredBitrate,
    };

    const run = async (): Promise<Station[]> => {
      switch (view.kind) {
        case 'mix':
          return catalog.mix(
            {
              sources: settings.sources,
              language: view.language,
              count: MIX_SIZE,
              hideBroken: settings.hideBroken,
            },
            signal,
          );
        case 'search':
        case 'language': {
          const s = catalog.search({
            ...searchOpts,
            text: view.kind === 'search' ? view.text : '',
            mode: view.kind === 'search' ? view.mode : 'exact',
            language: view.language,
          });
          session.current = s;
          const first = await s.next(signal);
          // Curated Kurdish stations lead a Kurdish language view.
          return view.kind === 'language' && view.language === 'ku'
            ? withCuratedFirst(first)
            : first;
        }
        case 'custom':
          return lib.customStations;
        case 'favourites':
        case 'playlist':
        case 'group': {
          const group =
            view.kind === 'group' ? lib.groups.find((g) => g.id === view.id) : undefined;
          const ids =
            view.kind === 'favourites'
              ? lib.favourites
              : view.kind === 'playlist'
                ? (lib.playlists.find((p) => p.id === view.id)?.stationIds ?? [])
                : (group?.stationIds ?? []);
          const { stations: resolved, fetched } = await catalog.resolve(ids, lib, signal);
          if (fetched.length) void updateLibrary((l) => rememberStations(l, fetched));
          if (group?.kind === 'language')
            return [...resolved, ...(await languageGroupPage(group, signal))];
          return resolved;
        }
      }
    };

    const languageGroupPage = async (
      group: Extract<Group, { kind: 'language' }>,
      sig: AbortSignal,
    ) => {
      const s = catalog.search({
        ...searchOpts,
        text: '',
        mode: 'exact',
        language: group.language,
      });
      session.current = s;
      const first = await s.next(sig);
      return group.language === 'ku' ? withCuratedFirst(first) : first;
    };

    run().then(
      (stations) => {
        if (signal.aborted) return;
        const hasMore = !!session.current && !session.current.done;
        setResult({
          key: requestKey,
          status: 'ready',
          stations: dedupe(stations),
          error: null,
          hasMore,
        });
      },
      (e: unknown) => {
        if (signal.aborted) return;
        const error = e instanceof Error ? e.message : 'Could not load stations';
        setResult({ key: requestKey, status: 'error', stations: [], error, hasMore: false });
      },
    );
    return () => controller.abort();
    // requestKey covers the view, the library slice, settings and reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, libraryReady, catalog]);

  const current = libraryReady && result?.key === requestKey ? result : null;
  const status: Feed['status'] = current ? current.status : 'loading';
  const stations = useMemo(() => current?.stations ?? [], [current]);

  const loadMore = useCallback(() => {
    const s = session.current;
    if (!s || s.done || loadingMore || status !== 'ready') return;
    setLoadingMore(true);
    const signal = abort.current?.signal;
    const key = requestKey;
    const finish = (more: Station[], hasMore: boolean) => {
      setLoadingMore(false);
      setResult((prev) =>
        prev && prev.key === key
          ? { ...prev, stations: dedupe([...prev.stations, ...more]), hasMore }
          : prev,
      );
    };
    s.next(signal).then(
      (more) => !signal?.aborted && finish(more, !s.done),
      () => finish([], false),
    );
  }, [loadingMore, status, requestKey]);

  const filtered = useMemo(() => {
    const text = filter.trim();
    if (!text) return stations;
    return stations.filter((s) => matchesQuery(s, { text, mode: 'exact', httpsOnly: false }, null));
  }, [stations, filter]);

  const context = useMemo<QueueContext>(() => {
    const kind =
      view.kind === 'mix'
        ? 'mix'
        : view.kind === 'search' || view.kind === 'language' || view.kind === 'custom'
          ? 'search'
          : view.kind;
    return { kind, id: 'id' in view ? view.id : undefined, label: viewLabel(view, library) };
  }, [view, library]);

  return {
    stations: filtered,
    status,
    error: current?.error ?? null,
    hasMore: !!current?.hasMore && !filter,
    loadingMore,
    loadMore,
    reload: () => setNonce((n) => n + 1),
    context,
  };
}

function dedupe(stations: Station[]): Station[] {
  const seen = new Set<string>();
  return stations.filter((s) => !seen.has(s.id) && seen.add(s.id));
}

function withCuratedFirst(stations: Station[]): Station[] {
  return dedupe([...CURATED_STATIONS, ...stations]);
}

/** Validates a regex search while typing, so the UI can flag it before it's used. */
export function isValidSearch(text: string, mode: 'exact' | 'regex'): boolean {
  return mode === 'exact' || !text || compileRegex(text) !== null;
}
