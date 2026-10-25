import { parseLibrary, type Library } from '../model/library';
import { parseSettings, type Settings } from '../model/settings';
import { parseStation, type Station } from '../model/station';
import { fromRadioBrowser, type RadioBrowserRow } from '../sources/radio-browser';
import { cleanText } from '../util/text';

/**
 * Tajdîn 0.0.x (and its earlier "zeng" name) kept each section under its own key.
 * Converted once on update, and again when an old backup file is imported.
 */
export const LEGACY_LOCAL_KEYS = {
  settings: ['tajdin.settings.v1', 'zeng.settings.v1'],
  favouriteIds: ['tajdin.favouriteIds.v1', 'zeng.favouriteIds.v1'],
  playlists: ['tajdin.playlists.v1', 'zeng.playlists.v1'],
  customStations: ['tajdin.customStations.v1', 'zeng.customStations.v1'],
  groups: ['tajdin.groups.v1'],
} as const;

export const ALL_LEGACY_KEYS: string[] = Object.values(LEGACY_LOCAL_KEYS).flat();

export interface LegacyData {
  settings?: unknown;
  favouriteIds?: unknown;
  playlists?: unknown;
  customStations?: unknown;
  groups?: unknown;
}

/** `tajdin:kurdish:7` → `ku:7`, raw Radio Browser UUID → `rb:<uuid>`, `custom:*` unchanged. */
export function legacyId(id: string): string {
  if (id.startsWith('tajdin:kurdish:')) return `ku:${id.slice('tajdin:kurdish:'.length)}`;
  if (id.startsWith('custom:')) return id;
  return `rb:${id}`;
}

function legacyStation(row: unknown): Station | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const r = row as RadioBrowserRow & { coverUrl?: string };
  if (typeof r.stationuuid !== 'string') return undefined;
  if (!r.stationuuid.startsWith('custom:')) return fromRadioBrowser(r);
  return parseStation({
    id: r.stationuuid,
    source: 'custom',
    name: cleanText(r.name),
    streamUrl: r.url_resolved || r.url,
    homepage: r.homepage,
    favicon: r.coverUrl || r.favicon,
    tags: [],
    languages: [],
  });
}

const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const ids = (v: unknown) => array(v).filter((x): x is string => typeof x === 'string' && x.length > 0).map(legacyId);

export function convertLegacy(data: LegacyData): { settings?: Settings; library: Partial<Library> } {
  const library: Partial<Library> = {};
  const now = new Date().toISOString();

  if (data.favouriteIds !== undefined) library.favourites = [...new Set(ids(data.favouriteIds))];

  if (data.customStations !== undefined) {
    library.customStations = array(data.customStations).flatMap((row) => {
      const s = legacyStation(row);
      return s ? [s] : [];
    });
  }

  if (data.playlists !== undefined) {
    library.playlists = parseLibrary({
      playlists: array(data.playlists).map((p) => {
        const old = p as Record<string, unknown>;
        return {
          id: old.id,
          name: old.name,
          description: old.description,
          stationIds: ids(old.stationUuids),
          createdAt: old.lastModified ?? now,
          updatedAt: old.lastModified ?? now,
        };
      }),
    }).playlists;
  }

  if (data.groups !== undefined) {
    library.groups = parseLibrary({
      groups: array(data.groups).map((g) => {
        const old = g as Record<string, unknown>;
        return {
          kind: 'manual',
          id: old.id,
          name: old.name,
          stationIds: ids(old.stationUuids),
          createdAt: old.lastModified ?? now,
          updatedAt: old.lastModified ?? now,
        };
      }),
    }).groups;
  }

  let settings: Settings | undefined;
  if (data.settings && typeof data.settings === 'object') {
    const old = data.settings as Record<string, unknown>;
    settings = parseSettings({
      theme: old.theme,
      defaultLanguage: typeof old.defaultLanguageCode === 'string' ? old.defaultLanguageCode : undefined,
      searchMode: old.searchMode === 'fuzzy' ? 'exact' : old.searchMode,
      preferredBitrate: old.preferredBitrateKbps,
      playOnSelect: old.playbackAutostart,
      welcomeDismissed: old.welcomePanelDismissed,
    });
  }

  return { settings, library };
}
