import { defaultRadioBrowserClient } from "../shared/api/radio-browser.api";
import { startPlaybackWithPlaylistSkip } from "./playerPlayback";
import { resolveStationForLibrary } from "./stationLibraryApi";
import { usePlayerStore } from "./store/playerStore";
import { useStationStore } from "./store/stationStore";
import type { Station } from "../shared/types/station";

function hasPlayableStreamUrl(s: Station | null | undefined): boolean {
  return Boolean((s?.url_resolved || s?.url || "").trim());
}

/** If the row has no stream URL yet, fetch full station metadata (same as library / Play resolve). */
async function ensureStationHasStreamUrl(station: Station): Promise<Station> {
  if (hasPlayableStreamUrl(station)) return station;
  if (!station.stationuuid) return station;
  const resolved = await resolveStationForLibrary(defaultRadioBrowserClient, station.stationuuid);
  if (resolved && hasPlayableStreamUrl(resolved)) return resolved;
  return station;
}

/** Start playback for a station from browse/favourites list (clears playlist context). */
export async function playStationFromList(station: Station): Promise<boolean> {
  const ready = await ensureStationHasStreamUrl(station);
  usePlayerStore.getState().setStation(ready);
  return startPlaybackWithPlaylistSkip();
}

/**
 * Move to adjacent station in {@link useStationStore}'s `searchResults` (wraps).
 * If current station is not in the list, "next" plays the first item, "prev" the last.
 */
export async function goToAdjacentInSearchResults(delta: -1 | 1): Promise<boolean> {
  const { searchResults } = useStationStore.getState();
  if (searchResults.length === 0) return false;

  const current = usePlayerStore.getState().station;
  const idx = current ? searchResults.findIndex((s) => s.stationuuid === current.stationuuid) : -1;

  let nextIdx: number;
  if (idx < 0) {
    nextIdx = delta > 0 ? 0 : searchResults.length - 1;
  } else {
    nextIdx = (idx + delta + searchResults.length) % searchResults.length;
  }

  const next = searchResults[nextIdx];
  if (!next) return false;
  const ready = await ensureStationHasStreamUrl(next);
  usePlayerStore.getState().setStation(ready);
  return startPlaybackWithPlaylistSkip();
}

/** Pick a random station from current search results (excluding current if possible). */
export async function goToRandomInSearchResults(): Promise<boolean> {
  const { searchResults } = useStationStore.getState();
  if (searchResults.length === 0) return false;
  const current = usePlayerStore.getState().station?.stationuuid;
  let pool = searchResults;
  if (current && searchResults.length > 1) {
    pool = searchResults.filter((s) => s.stationuuid !== current);
  }
  const next = pool[Math.floor(Math.random() * pool.length)]!;
  const ready = await ensureStationHasStreamUrl(next);
  usePlayerStore.getState().setStation(ready);
  return startPlaybackWithPlaylistSkip();
}
