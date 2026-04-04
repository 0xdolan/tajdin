import {
  STORAGE_KEYS,
  localGroupsStorage,
  localPlaylistsStorage,
} from "../shared/storage/instances";
import type { Group } from "../shared/types/group";
import type { Playlist } from "../shared/types/playlist";

export async function loadPlaylistsAndGroups(): Promise<{
  playlists: Playlist[];
  groups: Group[];
}> {
  const playlists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  return { playlists, groups };
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function appendStationToPlaylist(
  stationuuid: string,
  playlistId: string,
): Promise<boolean> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const idx = lists.findIndex((p) => p.id === playlistId);
  if (idx < 0) return false;
  const pl = lists[idx];
  if (pl.stationUuids.includes(stationuuid)) return true;
  const next = [...lists];
  next[idx] = {
    ...pl,
    stationUuids: [...pl.stationUuids, stationuuid],
    lastModified: nowIso(),
  };
  const r = await localPlaylistsStorage.set(STORAGE_KEYS.playlists, next);
  return r.success;
}

export async function appendStationToGroup(
  stationuuid: string,
  groupId: string,
): Promise<boolean> {
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return false;
  const gr = groups[idx];
  if (gr.stationUuids.includes(stationuuid)) return true;
  const next = [...groups];
  next[idx] = {
    ...gr,
    stationUuids: [...gr.stationUuids, stationuuid],
    lastModified: nowIso(),
  };
  const r = await localGroupsStorage.set(STORAGE_KEYS.groups, next);
  return r.success;
}
