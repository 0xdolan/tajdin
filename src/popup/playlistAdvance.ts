import { type RadioBrowserClient } from "../shared/api/radio-browser.api";
import { STORAGE_KEYS, localPlaylistsStorage } from "../shared/storage/instances";
import type { Station } from "../shared/types/station";

/**
 * After a failed load at `afterIndex`, find the next playlist entry with a resolvable stream URL.
 */
export async function findNextPlayableInPlaylist(
  client: RadioBrowserClient,
  playlistId: string,
  afterIndex: number,
): Promise<{ station: Station; index: number } | null> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const pl = lists.find((p) => p.id === playlistId);
  if (!pl) return null;
  for (let i = afterIndex + 1; i < pl.stationUuids.length; i++) {
    const uuid = pl.stationUuids[i]!;
    const st = await client.fetchStationByUuid(uuid);
    if (!st) continue;
    const url = st.url_resolved || st.url;
    if (!url) continue;
    return { station: st, index: i };
  }
  return null;
}

/**
 * Before `afterIndex`, find the last playlist entry with a resolvable stream URL (for previous-track).
 */
export async function findPreviousPlayableInPlaylist(
  client: RadioBrowserClient,
  playlistId: string,
  afterIndex: number,
): Promise<{ station: Station; index: number } | null> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const pl = lists.find((p) => p.id === playlistId);
  if (!pl) return null;
  for (let i = Math.min(afterIndex - 1, pl.stationUuids.length - 1); i >= 0; i--) {
    const uuid = pl.stationUuids[i]!;
    const st = await client.fetchStationByUuid(uuid);
    if (!st) continue;
    const url = st.url_resolved || st.url;
    if (!url) continue;
    return { station: st, index: i };
  }
  return null;
}
