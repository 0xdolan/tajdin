import type { Playlist } from "../types/playlist";
import { DEFAULT_SETTINGS, type Settings, parseSettingsWithDefaults } from "../types/settings";
import type { Station } from "../types/station";
import {
  STORAGE_KEYS,
  localCustomStationsStorage,
  localFavouriteIdsStorage,
  localPlaylistsStorage,
  localSettingsStorage,
} from "../storage/instances";
import {
  TAJDIN_BACKUP_FORMAT,
  TAJDIN_BACKUP_VERSION,
  type TajdinBackupData,
  type TajdinBackupFile,
  TajdinBackupFileSchema,
} from "./backup-schema";

export type { TajdinBackupData, TajdinBackupFile } from "./backup-schema";

export type LocalDataSnapshot = {
  settings: Settings;
  playlists: Playlist[];
  customStations: Station[];
  favouriteIds: string[];
};

export type ImportPreview = {
  mode: "merge" | "replace";
  sections: {
    settings: SectionLine;
    playlists: SectionLine;
    groups: SectionLine;
    customStations: SectionLine;
    favourites: SectionLine;
  };
};

export type SectionLine =
  | { state: "absent"; detail: string }
  | { state: "replace"; before: number; after: number; detail: string }
  | {
      state: "merge";
      detail: string;
      added: number;
      updated: number;
      localOnly: number;
    };

function playlistEqual(a: Playlist, b: Playlist): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    (a.description ?? "") === (b.description ?? "") &&
    (a.colour ?? "") === (b.colour ?? "") &&
    a.lastModified === b.lastModified &&
    a.stationUuids.length === b.stationUuids.length &&
    a.stationUuids.every((u, i) => u === b.stationUuids[i])
  );
}

function stationEqual(a: Station, b: Station): boolean {
  return (
    a.stationuuid === b.stationuuid &&
    a.name === b.name &&
    a.url === b.url &&
    (a.url_resolved ?? "") === (b.url_resolved ?? "") &&
    (a.tags ?? "") === (b.tags ?? "")
  );
}

function mergeById<T extends { id: string }>(local: T[], imported: T[]): T[] {
  if (imported.length === 0) return local;
  const m = new Map(local.map((x) => [x.id, x] as const));
  const newIds: string[] = [];
  for (const x of imported) {
    if (!m.has(x.id)) newIds.push(x.id);
    m.set(x.id, x);
  }
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of local) {
    seen.add(x.id);
    out.push(m.get(x.id)!);
  }
  for (const id of newIds) {
    if (!seen.has(id)) out.push(m.get(id)!);
  }
  return out;
}

function mergeStationsByUuid(local: Station[], imported: Station[]): Station[] {
  if (imported.length === 0) return local;
  const m = new Map(local.map((s) => [s.stationuuid, s] as const));
  const newUuids: string[] = [];
  for (const s of imported) {
    if (!m.has(s.stationuuid)) newUuids.push(s.stationuuid);
    m.set(s.stationuuid, s);
  }
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const s of local) {
    seen.add(s.stationuuid);
    out.push(m.get(s.stationuuid)!);
  }
  for (const u of newUuids) {
    if (!seen.has(u)) out.push(m.get(u)!);
  }
  return out;
}

function mergeFavouriteIds(local: string[], imported: string[]): string[] {
  if (imported.length === 0) return local;
  const s = new Set(local);
  const out = [...local];
  for (const id of imported) {
    if (!s.has(id)) {
      s.add(id);
      out.push(id);
    }
  }
  return out;
}

function countPlaylistMerge(local: Playlist[], imported: Playlist[] | undefined): { added: number; updated: number; localOnly: number } {
  if (!imported?.length) return { added: 0, updated: 0, localOnly: local.length };
  const localById = new Map(local.map((p) => [p.id, p] as const));
  const importIds = new Set(imported.map((p) => p.id));
  let added = 0;
  let updated = 0;
  for (const p of imported) {
    const prev = localById.get(p.id);
    if (!prev) added += 1;
    else if (!playlistEqual(prev, p)) updated += 1;
  }
  const localOnly = local.filter((p) => !importIds.has(p.id)).length;
  return { added, updated, localOnly };
}

function countStationMerge(local: Station[], imported: Station[] | undefined): { added: number; updated: number; localOnly: number } {
  if (!imported?.length) return { added: 0, updated: 0, localOnly: local.length };
  const localByU = new Map(local.map((s) => [s.stationuuid, s] as const));
  const importUuids = new Set(imported.map((s) => s.stationuuid));
  let added = 0;
  let updated = 0;
  for (const s of imported) {
    const prev = localByU.get(s.stationuuid);
    if (!prev) added += 1;
    else if (!stationEqual(prev, s)) updated += 1;
  }
  const localOnly = local.filter((s) => !importUuids.has(s.stationuuid)).length;
  return { added, updated, localOnly };
}

function countFavouriteMerge(local: string[], imported: string[] | undefined): { added: number } {
  if (!imported?.length) return { added: 0 };
  const s = new Set(local);
  let added = 0;
  for (const id of imported) {
    if (!s.has(id)) added += 1;
  }
  return { added };
}

function settingsKeysChanged(cur: Settings, imp: Settings | undefined): string[] {
  if (!imp) return [];
  const keys: (keyof Settings)[] = [
    "theme",
    "defaultLanguageCode",
    "popupWidthPx",
    "popupHeightPx",
    "audioBufferSizeSeconds",
    "searchMode",
    "preferredBitrateKbps",
    "playbackAutostart",
  ];
  const out: string[] = [];
  for (const k of keys) {
    if (cur[k] !== imp[k]) out.push(k);
  }
  return out;
}

export async function readLocalDataSnapshot(): Promise<LocalDataSnapshot> {
  const [playlists, customStations, favouriteIds, settings] = await Promise.all([
    localPlaylistsStorage.getWithDefault(STORAGE_KEYS.playlists, []),
    localCustomStationsStorage.getWithDefault(STORAGE_KEYS.customStations, []),
    localFavouriteIdsStorage.getWithDefault(STORAGE_KEYS.favouriteIds, []),
    localSettingsStorage.getWithDefault(STORAGE_KEYS.settings, DEFAULT_SETTINGS, { onInvalidStored: "default" }),
  ]);
  return { playlists, customStations, favouriteIds, settings };
}

export function buildBackupFile(snapshot: LocalDataSnapshot): TajdinBackupFile {
  return {
    format: TAJDIN_BACKUP_FORMAT,
    version: TAJDIN_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings: snapshot.settings,
      playlists: snapshot.playlists,
      customStations: snapshot.customStations,
      favouriteIds: snapshot.favouriteIds,
    },
  };
}

export function serializeBackupFile(file: TajdinBackupFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function parseBackupJsonText(text: string): { ok: true; file: TajdinBackupFile } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  const r = TajdinBackupFileSchema.safeParse(parsed);
  if (!r.success) {
    const msg = r.error.issues.map((i) => i.message).join("; ");
    return { ok: false, error: msg || "Backup validation failed." };
  }
  return { ok: true, file: r.data };
}

export function buildImportPreview(local: LocalDataSnapshot, data: TajdinBackupData, mode: "merge" | "replace"): ImportPreview {
  const sections = {
    settings: buildSettingsLine(local.settings, data.settings, mode),
    playlists: buildPlaylistsLine(local.playlists, data.playlists, mode),
    groups: buildGroupsLegacyLine(data),
    customStations: buildStationsLine(local.customStations, data.customStations, mode),
    favourites: buildFavouritesLine(local.favouriteIds, data.favouriteIds, mode),
  };
  return { mode, sections };
}

function buildSettingsLine(
  cur: Settings,
  imp: Settings | undefined,
  mode: "merge" | "replace",
): SectionLine {
  if (imp === undefined) {
    return {
      state: "absent",
      detail: "Not in backup — existing settings are left unchanged.",
    };
  }
  if (mode === "replace") {
    return {
      state: "replace",
      before: 0,
      after: 0,
      detail: "Settings will be replaced with the backup (validated defaults applied).",
    };
  }
  const keys = settingsKeysChanged(cur, imp);
  return {
    state: "merge",
    detail:
      keys.length === 0
        ? "Settings in backup match current values."
        : `Will update: ${keys.join(", ")}.`,
    added: 0,
    updated: keys.length,
    localOnly: 0,
  };
}

function buildPlaylistsLine(
  cur: Playlist[],
  imp: Playlist[] | undefined,
  mode: "merge" | "replace",
): SectionLine {
  if (imp === undefined) {
    return { state: "absent", detail: "Not in backup — existing playlists are left unchanged." };
  }
  if (mode === "replace") {
    return {
      state: "replace",
      before: cur.length,
      after: imp.length,
      detail: `Playlists: ${cur.length} now → ${imp.length} after import.`,
    };
  }
  const { added, updated, localOnly } = countPlaylistMerge(cur, imp);
  return {
    state: "merge",
    detail: `+${added} new, ${updated} updated, ${localOnly} local-only kept.`,
    added,
    updated,
    localOnly,
  };
}

function buildGroupsLegacyLine(data: TajdinBackupData): SectionLine {
  const n = data.groups?.length ?? 0;
  if (n === 0) {
    return { state: "absent", detail: "No legacy groups section in backup." };
  }
  return {
    state: "absent",
    detail: `Backup lists ${n} group(s); groups are no longer supported and will not be imported.`,
  };
}

function buildStationsLine(
  cur: Station[],
  imp: Station[] | undefined,
  mode: "merge" | "replace",
): SectionLine {
  if (imp === undefined) {
    return { state: "absent", detail: "Not in backup — existing custom stations are left unchanged." };
  }
  if (mode === "replace") {
    return {
      state: "replace",
      before: cur.length,
      after: imp.length,
      detail: `Custom stations: ${cur.length} now → ${imp.length} after import.`,
    };
  }
  const { added, updated, localOnly } = countStationMerge(cur, imp);
  return {
    state: "merge",
    detail: `+${added} new, ${updated} updated, ${localOnly} local-only kept.`,
    added,
    updated,
    localOnly,
  };
}

function buildFavouritesLine(
  cur: string[],
  imp: string[] | undefined,
  mode: "merge" | "replace",
): SectionLine {
  if (imp === undefined) {
    return { state: "absent", detail: "Not in backup — existing favourites are left unchanged." };
  }
  if (mode === "replace") {
    return {
      state: "replace",
      before: cur.length,
      after: imp.length,
      detail: `Favourites: ${cur.length} now → ${imp.length} after import.`,
    };
  }
  const { added } = countFavouriteMerge(cur, imp);
  return {
    state: "merge",
    detail: `+${added} new favourite ids (union, order preserved).`,
    added,
    updated: 0,
    localOnly: 0,
  };
}

export async function applyBackupReplace(data: TajdinBackupData): Promise<boolean> {
  const settings = parseSettingsWithDefaults(data.settings ?? DEFAULT_SETTINGS);
  const playlists = data.playlists ?? [];
  const customStations = data.customStations ?? [];
  const favouriteIds = data.favouriteIds ?? [];
  const results = await Promise.all([
    localSettingsStorage.set(STORAGE_KEYS.settings, settings),
    localPlaylistsStorage.set(STORAGE_KEYS.playlists, playlists),
    localCustomStationsStorage.set(STORAGE_KEYS.customStations, customStations),
    localFavouriteIdsStorage.set(STORAGE_KEYS.favouriteIds, favouriteIds),
  ]);
  return results.every((r) => r.success);
}

export async function applyBackupMerge(data: TajdinBackupData): Promise<boolean> {
  const cur = await readLocalDataSnapshot();
  const settings = data.settings
    ? parseSettingsWithDefaults({ ...cur.settings, ...data.settings })
    : cur.settings;
  const playlists = data.playlists ? mergeById(cur.playlists, data.playlists) : cur.playlists;
  const customStations = data.customStations
    ? mergeStationsByUuid(cur.customStations, data.customStations)
    : cur.customStations;
  const favouriteIds = data.favouriteIds ? mergeFavouriteIds(cur.favouriteIds, data.favouriteIds) : cur.favouriteIds;
  const results = await Promise.all([
    localSettingsStorage.set(STORAGE_KEYS.settings, settings),
    localPlaylistsStorage.set(STORAGE_KEYS.playlists, playlists),
    localCustomStationsStorage.set(STORAGE_KEYS.customStations, customStations),
    localFavouriteIdsStorage.set(STORAGE_KEYS.favouriteIds, favouriteIds),
  ]);
  return results.every((r) => r.success);
}
