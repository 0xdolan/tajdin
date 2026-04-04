import { useCallback, useEffect, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { defaultRadioBrowserClient } from "../../shared/api/radio-browser.api";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import { useSurface } from "../SurfaceContext";
import { loadPlaylistsForLibrary, resolveStationForLibrary } from "../stationLibraryApi";
import { useStationStore } from "../store/stationStore";
import { StationCard } from "./StationCard";
import { TajdinVirtuosoScroller } from "./TajdinVirtuosoScroller";

type FavListContext = {
  playlists: Playlist[];
  refreshLibrary: () => void;
};

export function FavouritesStationList() {
  const surface = useSurface();
  const favouriteIds = useStationStore((s) => s.favouriteIds);
  const replaceSearchResults = useStationStore((s) => s.replaceSearchResults);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLibrary = useCallback(() => {
    void loadPlaylistsForLibrary().then((r) => setPlaylists(r.playlists));
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const idsKey = favouriteIds.join("|");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const rows = await Promise.all(
        favouriteIds.map((id) => resolveStationForLibrary(defaultRadioBrowserClient, id)),
      );
      const list = rows.filter((x): x is Station => x != null);
      if (!cancelled) {
        setStations(list);
        replaceSearchResults(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey, favouriteIds, replaceSearchResults]);

  const mutedClass =
    surface === "light" ? "text-sm leading-relaxed text-neutral-600" : "text-sm leading-relaxed text-neutral-500";

  const listContext = useMemo<FavListContext>(
    () => ({ playlists, refreshLibrary }),
    [playlists, refreshLibrary],
  );

  if (favouriteIds.length === 0) {
    return <p className={mutedClass}>Save stations with the heart on Browse to see them here.</p>;
  }

  if (loading && stations.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 py-1" aria-busy="true" aria-label="Loading favourites">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={
              surface === "light"
                ? "h-[72px] shrink-0 animate-pulse rounded-md bg-neutral-200/90"
                : "h-[72px] shrink-0 animate-pulse rounded-md bg-neutral-800/80"
            }
          />
        ))}
      </div>
    );
  }

  if (!loading && stations.length === 0) {
    return <p className={mutedClass}>Could not resolve saved stations. Check your connection.</p>;
  }

  return (
    <Virtuoso<Station, FavListContext>
      className="h-full min-h-0"
      style={{ height: "100%" }}
      components={{ Scroller: TajdinVirtuosoScroller }}
      context={listContext}
      data={stations}
      defaultItemHeight={72}
      computeItemKey={(_index, station) => station.stationuuid}
      itemContent={(_index, station, ctx) => (
        <StationCard station={station} playlists={ctx.playlists} onLibraryMutated={ctx.refreshLibrary} />
      )}
    />
  );
}
