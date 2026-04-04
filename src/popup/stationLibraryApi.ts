import type { RadioBrowserClient } from "../shared/api/radio-browser.api";
import {
  STORAGE_KEYS,
  localCustomStationsStorage,
  localFavouriteIdsStorage,
  localPlaylistsStorage,
} from "../shared/storage/instances";
import type { Playlist } from "../shared/types/playlist";
import type { Station } from "../shared/types/station";
import { sanitizeDisplayText, sanitizeHttpOrHttpsUrl } from "../shared/utils/sanitize";
import { isValidHttpOrHttpsStreamUrl } from "../shared/utils/validate-stream-url";

export async function loadPlaylistsForLibrary(): Promise<{ playlists: Playlist[] }> {
  const playlists = await localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []);
  return { playlists };
}

export async function loadFavouriteIds(): Promise<string[]> {
  return localFavouriteIdsStorage.getWithDefault(STORAGE_KEYS.favouriteIds, []);
}

export async function loadCustomStations(): Promise<Station[]> {
  return localCustomStationsStorage.getWithDefault(STORAGE_KEYS.customStations, []);
}

/**
 * Persist a user stream (`http`/`https` only). {@link Station.stationuuid} uses `custom:` + UUID (FR-009).
 */
export async function addCustomStation(
  displayName: string,
  streamUrl: string,
  coverImageUrl?: string,
): Promise<Station | null> {
  const name = sanitizeDisplayText(displayName.trim(), { maxLength: 200 });
  const url = streamUrl.trim();
  if (!name || !isValidHttpOrHttpsStreamUrl(url)) return null;
  const cover = sanitizeHttpOrHttpsUrl(coverImageUrl?.trim());
  const station: Station = {
    stationuuid: `custom:${crypto.randomUUID()}`,
    name,
    url,
    url_resolved: url,
    tags: "custom",
    ...(cover ? { coverUrl: cover } : {}),
  };
  const list = await loadCustomStations();
  const r = await localCustomStationsStorage.set(STORAGE_KEYS.customStations, [...list, station]);
  return r.success ? station : null;
}

/** Resolve a station for playlist rows: local `custom:*` first, then Radio Browser. */
export async function resolveStationForLibrary(
  client: RadioBrowserClient,
  stationuuid: string,
): Promise<Station | null> {
  if (stationuuid.startsWith("custom:")) {
    const list = await loadCustomStations();
    return list.find((s) => s.stationuuid === stationuuid) ?? null;
  }
  return client.fetchStationByUuid(stationuuid);
}

export async function removeCustomStation(stationuuid: string): Promise<boolean> {
  const list = await loadCustomStations();
  const next = list.filter((s) => s.stationuuid !== stationuuid);
  if (next.length === list.length) return false;
  return (await localCustomStationsStorage.set(STORAGE_KEYS.customStations, next)).success;
}

/** Update a saved custom station (`custom:*` id). Preserves `stationuuid` and other fields (e.g. `tags`). */
export async function updateCustomStation(
  stationuuid: string,
  args: {
    displayName: string;
    streamUrl: string;
    /** Empty string removes `coverUrl`. */
    coverImageUrl: string;
  },
): Promise<Station | null> {
  if (!stationuuid.startsWith("custom:")) return null;
  const name = sanitizeDisplayText(args.displayName.trim(), { maxLength: 200 });
  const url = args.streamUrl.trim();
  if (!name || !isValidHttpOrHttpsStreamUrl(url)) return null;

  const coverRaw = args.coverImageUrl.trim();
  const coverSanitized = coverRaw ? sanitizeHttpOrHttpsUrl(coverRaw) : undefined;
  if (coverRaw && !coverSanitized) return null;

  const list = await loadCustomStations();
  const idx = list.findIndex((s) => s.stationuuid === stationuuid);
  if (idx < 0) return null;
  const prev = list[idx]!;
  const { coverUrl: _drop, ...rest } = prev;
  const nextStation: Station = {
    ...rest,
    name,
    url,
    url_resolved: url,
    ...(coverSanitized ? { coverUrl: coverSanitized } : {}),
  };

  const next = [...list];
  next[idx] = nextStation;
  const r = await localCustomStationsStorage.set(STORAGE_KEYS.customStations, next);
  return r.success ? nextStation : null;
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
