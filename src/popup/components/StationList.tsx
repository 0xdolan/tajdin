import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
} from "../../shared/api/radio-browser.api";
import type { Station } from "../../shared/types/station";
import { useStationStore } from "../store/stationStore";

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
};

function StationRow({ station }: { station: Station }) {
  const country = station.country ?? station.countrycode ?? "—";
  const lang = station.language ?? station.languagecodes ?? "";
  const meta = [country, lang].filter(Boolean).join(" · ");

  return (
    <div className="box-border flex h-14 flex-col justify-center border-b border-neutral-800/90 px-1 py-1.5">
      <p className="truncate text-sm font-medium text-neutral-100">{station.name}</p>
      <p className="truncate text-xs text-neutral-500">{meta || "Radio"}</p>
    </div>
  );
}

function StationListSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 py-1"
      aria-busy="true"
      aria-label="Loading stations"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-14 shrink-0 animate-pulse rounded-md bg-neutral-800/80" />
      ))}
    </div>
  );
}

export function StationList({ client = defaultRadioBrowserClient }: StationListProps) {
  const searchResults = useStationStore((s) => s.searchResults);
  const isSearchLoading = useStationStore((s) => s.isSearchLoading);
  const replaceSearchResults = useStationStore((s) => s.replaceSearchResults);
  const appendSearchResults = useStationStore((s) => s.appendSearchResults);
  const setSearchLoading = useStationStore((s) => s.setSearchLoading);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchingRef.current = false;
    replaceSearchResults([]);
    setSearchLoading(true);

    void (async () => {
      try {
        const batch = await client.searchStations({
          ...BROWSE_QUERY,
          offset: 0,
        });
        if (cancelled) return;
        replaceSearchResults(batch);
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
  }, [client, replaceSearchResults, setSearchLoading]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current || isSearchLoading) {
      return;
    }
    fetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const batch = await client.searchStations({
        ...BROWSE_QUERY,
        offset: offsetRef.current,
      });
      if (batch.length === 0) {
        hasMoreRef.current = false;
        return;
      }
      appendSearchResults(batch);
      offsetRef.current += batch.length;
      hasMoreRef.current = batch.length >= BROWSE_PAGE_SIZE;
    } catch {
      hasMoreRef.current = false;
    } finally {
      fetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [appendSearchResults, client, isSearchLoading]);

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
    <Virtuoso<Station>
      className="h-full min-h-0"
      style={{ height: "100%" }}
      data={searchResults}
      defaultItemHeight={56}
      atBottomThreshold={BROWSE_LOAD_THRESHOLD_PX}
      endReached={handleEndReached}
      computeItemKey={(_index, station) => station.stationuuid}
      itemContent={(_index, station) => <StationRow station={station} />}
      components={{
        Footer: () =>
          isLoadingMore ? (
            <div className="py-2" aria-hidden>
              <div className="h-14 animate-pulse rounded-md bg-neutral-800/60" />
            </div>
          ) : null,
      }}
    />
  );
}
