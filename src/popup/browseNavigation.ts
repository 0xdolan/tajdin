import { startPlaybackWithPlaylistSkip } from "./playerPlayback";
import { usePlayerStore } from "./store/playerStore";
import { useStationStore } from "./store/stationStore";
import type { Station } from "../shared/types/station";

/** Start playback for a station from browse/favourites list (clears playlist context). */
export async function playStationFromList(station: Station): Promise<boolean> {
  usePlayerStore.getState().setStation(station);
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
  usePlayerStore.getState().setStation(next);
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
  usePlayerStore.getState().setStation(next);
  return startPlaybackWithPlaylistSkip();
}
