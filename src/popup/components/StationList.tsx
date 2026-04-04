import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
  type StationSearchParams,
} from "../../shared/api/radio-browser.api";
import { fuzzySearchStations, regexSearchStations } from "../../shared/utils/fuzzy-search";
import { mergeStationsDedupe } from "../../shared/utils/station-merge";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import type { SearchMode } from "../hooks/useSearch";
import { useSurface } from "../SurfaceContext";
import { loadCustomStations, loadPlaylistsForLibrary } from "../stationLibraryApi";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";

export const BROWSE_PAGE_SIZE = 50;

/** Pixels from list bottom before {@link Virtuoso} fires `endReached` (task / PRD lazy-load). */
export const BROWSE_LOAD_THRESHOLD_PX = 200;

const BROWSE_QUERY = {
  limit: BROWSE_PAGE_SIZE,
  order: "clickcount",
  reverse: true,
} as const;

export type StationListProps = {
  client?: RadioBrowserClient;
  /** Debounced query (e.g. from {@link useSearch}). */
  searchQuery?: string;
  searchMode?: SearchMode;
  regexInvalid?: boolean;
  /** Radio Browser `language` search token (e.g. `spanish`); empty = any. */
  languageFilter?: string;
  /** Bump to refetch and merge custom stations into the first browse/search page. */
  customStationsTick?: number;
};

export type StationListContext = {
  playlists: Playlist[];
  refreshLibrary: () => void;
};

function StationListSkeleton() {
  const surface = useSurface();
  const bar =
    surface === "light" ? "h-[72px] shrink-0 animate-pulse rounded-md bg-neutral-200/90" : "h-[72px] shrink-0 animate-pulse rounded-md bg-neutral-800/80";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 py-1" aria-busy="true" aria-label="Loading stations">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={bar} />
      ))}
    </div>
  );
}

export function StationList({
  client = defaultRadioBrowserClient,
  searchQuery = "",
  searchMode = "fuzzy",
  regexInvalid = false,
  languageFilter = "",
  customStationsTick = 0,
}: StationListProps) {
  const surface = useSurface();
  const searchResults = useStationStore((s) => s.searchResults);
  const isSearchLoading = useStationStore((s) => s.isSearchLoading);
  const replaceSearchResults = useStationStore((s) => s.replaceSearchResults);
  const appendSearchResults = useStationStore((s) => s.appendSearchResults);
  const setSearchLoading = useStationStore((s) => s.setSearchLoading);

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
    }),
    [library.playlists, refreshLibrary],
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
  /** Server-side name filter is only used in fuzzy mode with a query; regex uses browse pages + client filter. */
  const fetchUsesNameFilter = searchMode === "fuzzy" && q !== "";

  const listParams = useCallback(
    (offset: number): StationSearchParams => ({
      ...BROWSE_QUERY,
      offset,
      ...(fetchUsesNameFilter ? { name: q } : {}),
      ...(lang ? { language: lang } : {}),
    }),
    [fetchUsesNameFilter, lang, q],
  );

  // Deps use `listParams` + `fetchUsesNameFilter` (via listParams) instead of `searchMode` so toggling
  // fuzzy ↔ regex with an empty query does not clear the list or refetch (same Radio Browser request).
  useEffect(() => {
    if (searchMode === "regex" && q !== "" && regexInvalid) {
      return;
    }

    let cancelled = false;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchingRef.current = false;
    corpusRef.current = [];

    replaceSearchResults([]);
    setSearchLoading(true);

    void (async () => {
      try {
        const batch = await client.searchStations(listParams(0));
        if (cancelled) return;

        const customList = await loadCustomStations();
        const mergedBase = mergeStationsDedupe(customList, batch);

        if (regexCorpusMode) {
          corpusRef.current = mergedBase;
          const r = regexSearchStations(corpusRef.current, searchQuery);
          replaceSearchResults(r.ok ? r.stations : []);
        } else {
          let out = mergedBase;
          if (searchMode === "fuzzy" && q) {
            out = fuzzySearchStations(out, q);
          }
          replaceSearchResults(out);
        }
        offsetRef.current = batch.length;
        hasMoreRef.current = batch.length >= BROWSE_PAGE_SIZE;
      } catch {
        if (!cancelled) {
          hasMoreRef.current = false;
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    listParams,
    regexInvalid,
    replaceSearchResults,
    searchQuery,
    setSearchLoading,
    customStationsTick,
  ]);

  const loadMore = useCallback(async () => {
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
          replaceSearchResults(r.stations);
        }
      } else {
        let out = batch;
        if (searchMode === "fuzzy" && q) {
          out = fuzzySearchStations(batch, q);
        }
        appendSearchResults(out);
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
    appendSearchResults,
    client,
    isSearchLoading,
    listParams,
    q,
    regexCorpusMode,
    regexInvalid,
    replaceSearchResults,
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
    return (
      <p className={`text-sm ${emptyC}`} role="status">
        No stations loaded. Check your connection and try reopening the popup.
      </p>
    );
  }

  return (
    <Virtuoso<Station, StationListContext>
      className="h-full min-h-0"
      style={{ height: "100%" }}
      context={listContext}
      data={searchResults}
      defaultItemHeight={72}
      atBottomThreshold={BROWSE_LOAD_THRESHOLD_PX}
      endReached={handleEndReached}
      computeItemKey={(_index, station) => station.stationuuid}
      itemContent={(_index, station, ctx) => (
        <StationCard station={station} playlists={ctx.playlists} onLibraryMutated={ctx.refreshLibrary} />
      )}
      components={{
        Footer: () =>
          isLoadingMore ? (
            <div className="py-2" aria-hidden>
              <div
                className={
                  surface === "light"
                    ? "h-[72px] animate-pulse rounded-md bg-neutral-200/80"
                    : "h-[72px] animate-pulse rounded-md bg-neutral-800/60"
                }
              />
            </div>
          ) : null,
      }}
    />
  );
}
