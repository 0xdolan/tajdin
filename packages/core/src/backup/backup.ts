import { z } from 'zod';
import { GroupSchema, parseLibrary, PlaylistSchema, type Library } from '../model/library';
import { pruneCache } from '../model/library-ops';
import { parseSettings, type Settings } from '../model/settings';
import { StationSchema } from '../model/station';
import { convertLegacy } from '../storage/legacy';

export const BACKUP_FORMAT = 'tajdin-backup';
export const BACKUP_VERSION = 2;

export const SECTIONS = ['settings', 'favourites', 'playlists', 'groups', 'customStations'] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  settings: 'Settings',
  favourites: 'Favourites',
  playlists: 'Playlists',
  groups: 'Groups',
  customStations: 'Custom stations',
};

const BackupV2Schema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  appVersion: z.string().optional(),
  data: z.object({
    settings: z.unknown().optional(),
    favourites: z.array(z.string().min(1)).optional(),
    playlists: z.array(PlaylistSchema).optional(),
    groups: z.array(GroupSchema).optional(),
    customStations: z.array(StationSchema).optional(),
    stationCache: z.record(z.string(), StationSchema).optional(),
  }),
});

const BackupV1Schema = z.object({
  format: z.union([z.literal('tajdin-backup'), z.literal('zeng-backup')]),
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    settings: z.unknown().optional(),
    favouriteIds: z.array(z.unknown()).optional(),
    playlists: z.array(z.unknown()).optional(),
    groups: z.array(z.unknown()).optional(),
    customStations: z.array(z.unknown()).optional(),
  }),
});

export interface BackupContents {
  exportedAt: string;
  /** Format version of the file that was read (1 = Tajdîn 0.0.x). */
  fileVersion: 1 | 2;
  settings?: Settings;
  library: Partial<Library>;
}

export class BackupError extends Error {
  override name = 'BackupError';
}

export function createBackup(input: {
  settings: Settings;
  library: Library;
  sections?: readonly Section[];
  appVersion: string;
}) {
  const include = new Set(input.sections ?? SECTIONS);
  const { library } = input;
  const data: z.input<typeof BackupV2Schema>['data'] = {};
  if (include.has('settings')) data.settings = input.settings;
  if (include.has('favourites')) data.favourites = library.favourites;
  if (include.has('playlists')) data.playlists = library.playlists;
  if (include.has('groups')) data.groups = library.groups;
  if (include.has('customStations')) data.customStations = library.customStations;
  // Station snapshots let the backup restore fully, without a network lookup per station.
  data.stationCache = library.stationCache;
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: input.appVersion,
    data,
  };
}

export function backupFileName(date = new Date()): string {
  return `tajdin-backup-${date.toISOString().slice(0, 10)}.json`;
}

/** Validates a backup file. Throws {@link BackupError} with a readable message; never partially applies. */
export function parseBackup(text: string): BackupContents {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupError('This file is not valid JSON.');
  }
  if (!json || typeof json !== 'object') throw new BackupError('This file is not a Tajdîn backup.');
  const head = json as { format?: unknown; version?: unknown };
  if (head.format !== BACKUP_FORMAT && head.format !== 'zeng-backup') {
    throw new BackupError('This file is not a Tajdîn backup.');
  }

  if (head.version === 1) {
    const r = BackupV1Schema.safeParse(json);
    if (!r.success) throw new BackupError(`The backup is damaged: ${firstIssue(r.error)}`);
    const converted = convertLegacy(r.data.data);
    return ensureNotEmpty({ exportedAt: r.data.exportedAt, fileVersion: 1, ...converted });
  }

  if (head.version === BACKUP_VERSION) {
    const r = BackupV2Schema.safeParse(json);
    if (!r.success) throw new BackupError(`The backup is damaged: ${firstIssue(r.error)}`);
    const d = r.data.data;
    const library: Partial<Library> = {};
    if (d.favourites) library.favourites = [...new Set(d.favourites)];
    if (d.playlists) library.playlists = d.playlists;
    if (d.groups) library.groups = d.groups;
    if (d.customStations) library.customStations = d.customStations;
    if (d.stationCache) library.stationCache = d.stationCache;
    return ensureNotEmpty({
      exportedAt: r.data.exportedAt,
      fileVersion: 2,
      settings: d.settings === undefined ? undefined : parseSettings(d.settings),
      library,
    });
  }

  throw new BackupError(
    typeof head.version === 'number' && head.version > BACKUP_VERSION
      ? 'This backup was made by a newer version of Tajdîn. Update the extension first.'
      : 'Unknown backup version.',
  );
}

function ensureNotEmpty(contents: BackupContents): BackupContents {
  if (presentSections(contents).length === 0) throw new BackupError('The backup contains no data.');
  return contents;
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `${issue.path.join('.') || 'file'}: ${issue.message}` : 'invalid structure';
}

export function presentSections(contents: BackupContents): Section[] {
  return SECTIONS.filter((s) => (s === 'settings' ? contents.settings !== undefined : contents.library[s] !== undefined));
}

export type ImportMode = 'merge' | 'replace';

export interface SectionPreview {
  section: Section;
  /** In the file but not on this device. */
  added: number;
  /** On both, and the file's copy differs (merge: the file wins). */
  updated: number;
  /** On both and identical. */
  unchanged: number;
  /** On this device only: kept by merge, removed by replace. */
  localOnly: number;
}

export function previewImport(contents: BackupContents, library: Library): SectionPreview[] {
  return presentSections(contents).map((section) => {
    if (section === 'settings') return { section, added: 0, updated: 1, unchanged: 0, localOnly: 0 };
    if (section === 'favourites') {
      const incoming = new Set(contents.library.favourites);
      const local = new Set(library.favourites);
      const both = [...incoming].filter((id) => local.has(id)).length;
      return { section, added: incoming.size - both, updated: 0, unchanged: both, localOnly: local.size - both };
    }
    const incoming = (contents.library[section] ?? []) as { id: string }[];
    const local = new Map((library[section] as { id: string }[]).map((x) => [x.id, JSON.stringify(x)]));
    let added = 0;
    let updated = 0;
    let unchanged = 0;
    for (const item of incoming) {
      const existing = local.get(item.id);
      if (existing === undefined) added++;
      else if (existing === JSON.stringify(item)) unchanged++;
      else updated++;
    }
    const incomingIds = new Set(incoming.map((x) => x.id));
    const localOnly = [...local.keys()].filter((id) => !incomingIds.has(id)).length;
    return { section, added, updated, unchanged, localOnly };
  });
}

/**
 * Merge: favourites are unioned; playlists, groups and custom stations are upserted by ID
 * (the file wins), local-only items are kept. Replace: each section in the file overwrites the
 * local one. Sections that aren't in the file, or that the user unticked, are never touched.
 */
export function applyImport(
  contents: BackupContents,
  current: { settings: Settings; library: Library },
  mode: ImportMode,
  sections: readonly Section[] = SECTIONS,
): { settings: Settings; library: Library } {
  const use = new Set(sections.filter((s) => presentSections(contents).includes(s)));
  const lib = { ...current.library };
  const incoming = contents.library;

  const upsert = <T extends { id: string }>(local: T[], from: T[]) => {
    if (mode === 'replace') return from;
    const byId = new Map(from.map((x) => [x.id, x]));
    const merged = local.map((x) => byId.get(x.id) ?? x);
    const localIds = new Set(local.map((x) => x.id));
    return [...merged, ...from.filter((x) => !localIds.has(x.id))];
  };

  if (use.has('favourites') && incoming.favourites) {
    lib.favourites = mode === 'replace' ? incoming.favourites : [...new Set([...lib.favourites, ...incoming.favourites])];
  }
  if (use.has('playlists') && incoming.playlists) lib.playlists = upsert(lib.playlists, incoming.playlists);
  if (use.has('groups') && incoming.groups) lib.groups = upsert(lib.groups, incoming.groups);
  if (use.has('customStations') && incoming.customStations) {
    lib.customStations = upsert(lib.customStations, incoming.customStations);
  }
  lib.stationCache = { ...lib.stationCache, ...incoming.stationCache };

  return {
    settings: use.has('settings') && contents.settings ? contents.settings : current.settings,
    library: pruneCache(parseLibrary(lib)),
  };
}
