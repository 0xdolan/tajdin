import {
  STORAGE_KEYS,
  localGroupsStorage,
  localPlaylistsStorage,
} from "../shared/storage/instances";
import type { Group } from "../shared/types/group";
import type { Playlist } from "../shared/types/playlist";
import {
  DEFAULT_GROUP_ICON_KEY,
  isValidGroupIconKey,
} from "../shared/utils/group-icon-keys";

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

export async function createPlaylist(name: string): Promise<Playlist | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const pl: Playlist = {
    id: crypto.randomUUID(),
    name: trimmed,
    stationUuids: [],
    lastModified: nowIso(),
  };
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const r = await localPlaylistsStorage.set(STORAGE_KEYS.playlists, [...lists, pl]);
  return r.success ? pl : null;
}

export async function renamePlaylist(playlistId: string, name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const idx = lists.findIndex((p) => p.id === playlistId);
  if (idx < 0) return false;
  const next = [...lists];
  const pl = next[idx]!;
  next[idx] = { ...pl, name: trimmed, lastModified: nowIso() };
  return (await localPlaylistsStorage.set(STORAGE_KEYS.playlists, next)).success;
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const next = lists.filter((p) => p.id !== playlistId);
  if (next.length === lists.length) return false;
  return (await localPlaylistsStorage.set(STORAGE_KEYS.playlists, next)).success;
}

export async function removeStationFromPlaylist(
  playlistId: string,
  stationuuid: string,
): Promise<boolean> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const idx = lists.findIndex((p) => p.id === playlistId);
  if (idx < 0) return false;
  const pl = lists[idx]!;
  const stationUuids = pl.stationUuids.filter((u) => u !== stationuuid);
  if (stationUuids.length === pl.stationUuids.length) return false;
  const next = [...lists];
  next[idx] = { ...pl, stationUuids, lastModified: nowIso() };
  return (await localPlaylistsStorage.set(STORAGE_KEYS.playlists, next)).success;
}

export async function reorderPlaylistStations(
  playlistId: string,
  stationUuids: string[],
): Promise<boolean> {
  const lists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  const idx = lists.findIndex((p) => p.id === playlistId);
  if (idx < 0) return false;
  const pl = lists[idx]!;
  const next = [...lists];
  next[idx] = { ...pl, stationUuids: [...stationUuids], lastModified: nowIso() };
  return (await localPlaylistsStorage.set(STORAGE_KEYS.playlists, next)).success;
}

export async function createGroup(name: string, iconKey?: string): Promise<Group | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const key =
    iconKey && isValidGroupIconKey(iconKey) ? iconKey : DEFAULT_GROUP_ICON_KEY;
  const gr: Group = {
    id: crypto.randomUUID(),
    name: trimmed,
    stationUuids: [],
    iconKey: key,
    lastModified: nowIso(),
  };
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const r = await localGroupsStorage.set(STORAGE_KEYS.groups, [...groups, gr]);
  return r.success ? gr : null;
}

export async function renameGroup(groupId: string, name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return false;
  const next = [...groups];
  const gr = next[idx]!;
  next[idx] = { ...gr, name: trimmed, lastModified: nowIso() };
  return (await localGroupsStorage.set(STORAGE_KEYS.groups, next)).success;
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const next = groups.filter((g) => g.id !== groupId);
  if (next.length === groups.length) return false;
  return (await localGroupsStorage.set(STORAGE_KEYS.groups, next)).success;
}

export async function removeStationFromGroup(
  groupId: string,
  stationuuid: string,
): Promise<boolean> {
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return false;
  const gr = groups[idx]!;
  const stationUuids = gr.stationUuids.filter((u) => u !== stationuuid);
  if (stationUuids.length === gr.stationUuids.length) return false;
  const next = [...groups];
  next[idx] = { ...gr, stationUuids, lastModified: nowIso() };
  return (await localGroupsStorage.set(STORAGE_KEYS.groups, next)).success;
}

export async function setGroupIconKey(groupId: string, iconKey: string): Promise<boolean> {
  if (!isValidGroupIconKey(iconKey)) return false;
  const groups = await localGroupsStorage.getWithDefault(STORAGE_KEYS.groups, []);
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx < 0) return false;
  const next = [...groups];
  const gr = next[idx]!;
  next[idx] = { ...gr, iconKey, lastModified: nowIso() };
  return (await localGroupsStorage.set(STORAGE_KEYS.groups, next)).success;
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
