import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
  type StationSearchParams,
} from "../../shared/api/radio-browser.api";
import { regexSearchStations } from "../../shared/utils/fuzzy-search";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import type { SearchMode } from "../hooks/useSearch";
import { useSurface } from "../SurfaceContext";
import { STATION_LIST_ROW_HEIGHT_PX } from "../constants/stationListLayout";
import { loadCustomStations, loadPlaylistsForLibrary } from "../stationLibraryApi";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";
import { TajdinVirtuosoScroller } from "./TajdinVirtuosoScroller";

export const BROWSE_PAGE_SIZE = 50;

/** Pixels from list bottom before {@link Virtuoso} fires `endReached` (task / PRD lazy-load). */
export const BROWSE_LOAD_THRESHOLD_PX = 200;

/** Default ranked browse (name search, regex corpus pages, paginated continuation). */
const BROWSE_QUERY_RANKED = {
  limit: BROWSE_PAGE_SIZE,
  order: "clickcount",
  reverse: true,
} as const;

/** Idle browse: empty query, not building a regex corpus — varied discovery each popup mount. */
const BROWSE_QUERY_RANDOM = {
  limit: BROWSE_PAGE_SIZE,
  order: "random",
  reverse: false,
} as const;

export type StationListProps = {
  client?: RadioBrowserClient;
  /** Debounced query (e.g. from {@link useSearch}). */
  searchQuery?: string;
  searchMode?: SearchMode;
  regexInvalid?: boolean;
  /** Radio Browser `language` search token (e.g. `spanish`); empty = any. Ignored when {@link customStationsOnly}. */
  languageFilter?: string;
  /** When true, list only saved custom streams (local storage); search filters that list client-side. */
  customStationsOnly?: boolean;
  /** Bump to refetch custom list or browse after add/remove custom station. */
  customStationsTick?: number;
  /**
   * When true, results and loading live in this component only (do not read/write global {@link useStationStore} search buffers).
   */
  isolated?: boolean;
  /**
   * With {@link isolated}, row tap appends the station to this playlist instead of starting playback.
   */
  appendToPlaylist?: { playlistId: string };
};

export type StationListContext = {
  playlists: Playlist[];
  refreshLibrary: () => void;
  appendToPlaylist?: { playlistId: string };
};

function StationListSkeleton() {
  const surface = useSurface();
  const bar =
    surface === "light"
      ? "shrink-0 animate-pulse rounded-md bg-neutral-200/90"
      : "shrink-0 animate-pulse rounded-md bg-neutral-800/80";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 py-1" aria-busy="true" aria-label="Loading stations">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={bar} style={{ height: STATION_LIST_ROW_HEIGHT_PX }} />
      ))}
    </div>
  );
}

export function StationList({
  client = defaultRadioBrowserClient,
  searchQuery = "",
  searchMode = "exact",
  regexInvalid = false,
  languageFilter = "",
  customStationsOnly = false,
  customStationsTick = 0,
  isolated = false,
  appendToPlaylist,
}: StationListProps) {
  const surface = useSurface();
  const storeResults = useStationStore((s) => s.searchResults);
  const storeLoading = useStationStore((s) => s.isSearchLoading);
  const replaceSearchResults = useStationStore((s) => s.replaceSearchResults);
  const appendSearchResults = useStationStore((s) => s.appendSearchResults);
  const setSearchLoading = useStationStore((s) => s.setSearchLoading);

  const [localResults, setLocalResults] = useState<Station[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  const appendLocalResults = useCallback((more: Station[]) => {
    setLocalResults((prev) => {
      const seen = new Set(prev.map((x) => x.stationuuid));
      const merged = [...prev];
      for (const st of more) {
        if (!seen.has(st.stationuuid)) {
          seen.add(st.stationuuid);
          merged.push(st);
        }
      }
      return merged;
    });
  }, []);

  const searchResults = isolated ? localResults : storeResults;
  const isSearchLoading = isolated ? localLoading : storeLoading;
  const replaceResults = isolated ? setLocalResults : replaceSearchResults;
  const appendResults = isolated ? appendLocalResults : appendSearchResults;
  const setLoading = isolated ? setLocalLoading : setSearchLoading;

  const [library, setLibrary] = useState<{ playlists: Playlist[] }>({ playlists: [] });
  const refreshLibrary = useCallback(() => {
    void loadPlaylistsForLibrary().then(setLibrary);
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const listContext = useMemo<StationListContext>(
    () => ({
      playlists: library.playlists,
      refreshLibrary,
      appendToPlaylist,
    }),
    [appendToPlaylist, library.playlists, refreshLibrary],
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const corpusRef = useRef<Station[]>([]);

  const q = searchQuery.trim();
  const lang = languageFilter.trim();
  const regexCorpusMode =
    searchMode === "regex" && q !== "" && !regexInvalid;
  /** Server-side name filter in exact mode with a query; regex uses browse pages + client filter. */
  const fetchUsesNameFilter = searchMode === "exact" && q !== "";
  /** Random order only when not searching by name and not paging a regex corpus (session-restored query still uses ranked or name as appropriate). */
  const useRandomBrowseOrder = !fetchUsesNameFilter && !regexCorpusMode;

  const listParams = useCallback(
    (offset: number): StationSearchParams => ({
      ...(useRandomBrowseOrder ? BROWSE_QUERY_RANDOM : BROWSE_QUERY_RANKED),
      offset,
      ...(fetchUsesNameFilter ? { name: q } : {}),
      ...(lang ? { language: lang } : {}),
    }),
    [fetchUsesNameFilter, lang, q, useRandomBrowseOrder],
  );

  // Deps use `listParams` + `fetchUsesNameFilter` (via listParams) instead of `searchMode` so toggling
  // exact ↔ regex with an empty query does not clear the list or refetch (same Radio Browser request).
  useEffect(() => {
    if (searchMode === "regex" && q !== "" && regexInvalid) {
      return;
    }

    let cancelled = false;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchingRef.current = false;
    corpusRef.current = [];

    replaceResults([]);
    setLoading(true);

    void (async () => {
      try {
        if (customStationsOnly) {
          const customList = await loadCustomStations();
          if (cancelled) return;
          if (regexCorpusMode) {
            corpusRef.current = customList;
            const r = regexSearchStations(corpusRef.current, searchQuery);
            replaceResults(r.ok ? r.stations : []);
          } else if (fetchUsesNameFilter) {
            const low = q.toLowerCase();
            replaceResults(customList.filter((s) => s.name.toLowerCase().includes(low)));
          } else {
            replaceResults(customList);
          }
          offsetRef.current = customList.length;
          hasMoreRef.current = false;
        } else {
          const batch = await client.searchStations(listParams(0));
          if (cancelled) return;

          if (regexCorpusMode) {
            corpusRef.current = batch;
            const r = regexSearchStations(corpusRef.current, searchQuery);
            replaceResults(r.ok ? r.stations : []);
          } else {
            replaceResults(batch);
          }
          offsetRef.current = batch.length;
          hasMoreRef.current = batch.length >= BROWSE_PAGE_SIZE;
        }
      } catch {
        if (!cancelled) {
          hasMoreRef.current = false;
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    customStationsOnly,
    customStationsTick,
    fetchUsesNameFilter,
    listParams,
    q,
    regexCorpusMode,
    regexInvalid,
    replaceResults,
    searchQuery,
    setLoading,
  ]);

  const loadMore = useCallback(async () => {
    if (customStationsOnly) {
      return;
    }
    if (fetchingRef.current || !hasMoreRef.current || isSearchLoading) {
      return;
    }
    if (searchMode === "regex" && q !== "" && regexInvalid) {
      return;
    }

    fetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const batch = await client.searchStations(listParams(offsetRef.current));
      if (batch.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      if (regexCorpusMode) {
        corpusRef.current = [...corpusRef.current, ...batch];
        const r = regexSearchStations(corpusRef.current, searchQuery);
        if (r.ok) {
          replaceResults(r.stations);
        }
      } else {
        appendResults(batch);
      }
      offsetRef.current += batch.length;
      hasMoreRef.current = batch.length >= BROWSE_PAGE_SIZE;
    } catch {
      hasMoreRef.current = false;
    } finally {
      fetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [
    appendResults,
    client,
    customStationsOnly,
    isSearchLoading,
    listParams,
    q,
    regexCorpusMode,
    regexInvalid,
    replaceResults,
    searchMode,
    searchQuery,
  ]);

  const handleEndReached = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  if (isSearchLoading && searchResults.length === 0) {
    return <StationListSkeleton />;
  }

  if (!isSearchLoading && searchResults.length === 0) {
    const emptyC = surface === "light" ? "text-neutral-600" : "text-neutral-500";
    const msg = customStationsOnly
      ? "No custom stations match. Add one with Add station, or open Settings → Stations. Turn off Custom only to browse Radio Browser."
      : "No stations loaded. Check your connection and try reopening the popup.";
    return (
      <p className={`text-sm ${emptyC}`} role="status">
        {msg}
      </p>
    );
  }

  return (
    <Virtuoso<Station, StationListContext>
      className="h-full min-h-0"
      style={{ height: "100%" }}
      context={listContext}
      data={searchResults}
      defaultItemHeight={STATION_LIST_ROW_HEIGHT_PX}
      atBottomThreshold={BROWSE_LOAD_THRESHOLD_PX}
      endReached={handleEndReached}
      computeItemKey={(_index, station) => station.stationuuid}
      itemContent={(_index, station, ctx) => (
        <StationCard
          station={station}
          playlists={ctx.playlists}
          onLibraryMutated={ctx.refreshLibrary}
          appendToPlaylistOnActivate={ctx.appendToPlaylist}
        />
      )}
      components={{
        Scroller: TajdinVirtuosoScroller,
        Footer: () =>
          isLoadingMore ? (
            <div className="py-2" aria-hidden>
              <div
                className={
                  surface === "light"
                    ? "animate-pulse rounded-md bg-neutral-200/80"
                    : "animate-pulse rounded-md bg-neutral-800/60"
                }
                style={{ height: STATION_LIST_ROW_HEIGHT_PX }}
              />
            </div>
          ) : null,
      }}
    />
  );
}
