import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
  type StationSearchParams,
} from "../../shared/api/radio-browser.api";
import { fuzzySearchStations, regexSearchStations } from "../../shared/utils/fuzzy-search";
import type { Group } from "../../shared/types/group";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import type { SearchMode } from "../hooks/useSearch";
import { loadPlaylistsAndGroups } from "../stationLibraryApi";
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
};

export type StationListContext = {
  playlists: Playlist[];
  groups: Group[];
  refreshLibrary: () => void;
};

function StationListSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 py-1"
      aria-busy="true"
      aria-label="Loading stations"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-[72px] shrink-0 animate-pulse rounded-md bg-neutral-800/80" />
      ))}
    </div>
  );
}

export function StationList({
  client = defaultRadioBrowserClient,
  searchQuery = "",
  searchMode = "fuzzy",
  regexInvalid = false,
}: StationListProps) {
  const searchResults = useStationStore((s) => s.searchResults);
  const isSearchLoading = useStationStore((s) => s.isSearchLoading);
  const replaceSearchResults = useStationStore((s) => s.replaceSearchResults);
  const appendSearchResults = useStationStore((s) => s.appendSearchResults);
  const setSearchLoading = useStationStore((s) => s.setSearchLoading);

  const [library, setLibrary] = useState<{ playlists: Playlist[]; groups: Group[] }>({
    playlists: [],
    groups: [],
  });
  const refreshLibrary = useCallback(() => {
    void loadPlaylistsAndGroups().then(setLibrary);
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const listContext = useMemo<StationListContext>(
    () => ({
      playlists: library.playlists,
      groups: library.groups,
      refreshLibrary,
    }),
    [library.playlists, library.groups, refreshLibrary],
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const corpusRef = useRef<Station[]>([]);

  const q = searchQuery.trim();
  const regexCorpusMode =
    searchMode === "regex" && q !== "" && !regexInvalid;

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
        const params: StationSearchParams = {
          ...BROWSE_QUERY,
          offset: 0,
          ...(searchMode === "fuzzy" && q ? { name: q } : {}),
        };
        const batch = await client.searchStations(params);
        if (cancelled) return;

        if (regexCorpusMode) {
          corpusRef.current = batch;
          const r = regexSearchStations(corpusRef.current, searchQuery);
          replaceSearchResults(r.ok ? r.stations : []);
        } else {
          let out = batch;
          if (searchMode === "fuzzy" && q) {
            out = fuzzySearchStations(batch, q);
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
    q,
    regexCorpusMode,
    regexInvalid,
    replaceSearchResults,
    searchMode,
    searchQuery,
    setSearchLoading,
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
      const params: StationSearchParams = {
        ...BROWSE_QUERY,
        offset: offsetRef.current,
        ...(searchMode === "fuzzy" && q ? { name: q } : {}),
      };
      const batch = await client.searchStations(params);
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
    return (
      <p className="text-sm text-neutral-500" role="status">
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
        <StationCard
          station={station}
          playlists={ctx.playlists}
          groups={ctx.groups}
          onLibraryMutated={ctx.refreshLibrary}
        />
      )}
      components={{
        Footer: () =>
          isLoadingMore ? (
            <div className="py-2" aria-hidden>
              <div className="h-[72px] animate-pulse rounded-md bg-neutral-800/60" />
            </div>
          ) : null,
      }}
    />
  );
}
