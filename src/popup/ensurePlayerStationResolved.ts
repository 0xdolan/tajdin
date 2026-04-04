import { defaultRadioBrowserClient, type RadioBrowserClient } from "../shared/api/radio-browser.api";
import { resolveStationForLibrary } from "./stationLibraryApi";
import { usePlayerStore } from "./store/playerStore";

function hasPlayableUrl(station: { url_resolved?: string | null; url?: string | null } | null): boolean {
  if (!station) return false;
  return Boolean((station.url_resolved || station.url || "").trim());
}

/**
 * If the store has a persisted {@link usePlayerStore} `stationuuid` but no playable `station` / URL
 * (e.g. after `applySessionPlayer` on popup open), resolve metadata and apply via
 * {@link usePlayerStore.getState().restoreResolvedStation}.
 */
export async function ensurePlayerStationResolved(
  client: RadioBrowserClient = defaultRadioBrowserClient,
): Promise<boolean> {
  const { stationuuid, station } = usePlayerStore.getState();
  if (!stationuuid) return false;
  if (station?.stationuuid === stationuuid && hasPlayableUrl(station)) {
    return true;
  }
  const resolved = await resolveStationForLibrary(client, stationuuid);
  if (!resolved || !hasPlayableUrl(resolved)) {
    return false;
  }
  usePlayerStore.getState().restoreResolvedStation(resolved);
  return true;
}
