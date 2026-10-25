import { EMPTY_LIBRARY, parseLibrary, type Library } from '../model/library';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from '../model/settings';
import type { StorageArea } from './area';
import { ALL_LEGACY_KEYS, convertLegacy, LEGACY_LOCAL_KEYS, type LegacyData } from './legacy';

export const KEYS = {
  settings: 'tajdin.v2.settings',
  library: 'tajdin.v2.library',
  schema: 'tajdin.v2.schema',
  /** Session area: what the player is doing right now. */
  player: 'tajdin.v2.player',
  /** Session area: popup UI state (tab, query, filters) so reopening restores it. */
  ui: 'tajdin.v2.ui',
} as const;

const SCHEMA_VERSION = 2;

export interface Repository {
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;
  getLibrary(): Promise<Library>;
  /** Read-modify-write. Concurrent writers are serialised within one page. */
  updateLibrary(update: (library: Library) => Library): Promise<Library>;
  replaceAll(data: { settings?: Settings; library?: Library }): Promise<void>;
  onSettings(listener: (settings: Settings) => void): () => void;
  onLibrary(listener: (library: Library) => void): () => void;
  /** Moves 0.0.x data to the v2 layout once. Safe to call from every page on start. */
  migrate(): Promise<void>;
}

export function createRepository(local: StorageArea): Repository {
  let writes: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = writes.then(task, task);
    writes = next.catch(() => undefined);
    return next;
  };

  const getSettings = async () => parseSettings((await local.get([KEYS.settings]))[KEYS.settings]);
  const getLibrary = async () => parseLibrary((await local.get([KEYS.library]))[KEYS.library]);

  return {
    getSettings,
    getLibrary,

    updateSettings: (patch) =>
      serial(async () => {
        const next = parseSettings({ ...(await getSettings()), ...patch });
        await local.set({ [KEYS.settings]: next });
        return next;
      }),

    updateLibrary: (update) =>
      serial(async () => {
        const next = parseLibrary(update(await getLibrary()));
        await local.set({ [KEYS.library]: next });
        return next;
      }),

    replaceAll: (data) =>
      serial(async () => {
        const items: Record<string, unknown> = {};
        if (data.settings) items[KEYS.settings] = parseSettings(data.settings);
        if (data.library) items[KEYS.library] = parseLibrary(data.library);
        await local.set(items);
      }),

    onSettings(listener) {
      return local.onChanged((changes) => {
        if (KEYS.settings in changes) listener(parseSettings(changes[KEYS.settings]?.newValue));
      });
    },

    onLibrary(listener) {
      return local.onChanged((changes) => {
        if (KEYS.library in changes) listener(parseLibrary(changes[KEYS.library]?.newValue));
      });
    },

    migrate: () =>
      serial(async () => {
        const current = await local.get([KEYS.schema, ...ALL_LEGACY_KEYS]);
        if (current[KEYS.schema] === SCHEMA_VERSION) return;
        const pick = (keys: readonly string[]) => keys.map((k) => current[k]).find((v) => v !== undefined);
        const legacy: LegacyData = {
          settings: pick(LEGACY_LOCAL_KEYS.settings),
          favouriteIds: pick(LEGACY_LOCAL_KEYS.favouriteIds),
          playlists: pick(LEGACY_LOCAL_KEYS.playlists),
          customStations: pick(LEGACY_LOCAL_KEYS.customStations),
          groups: pick(LEGACY_LOCAL_KEYS.groups),
        };
        const hasLegacy = Object.values(legacy).some((v) => v !== undefined);
        const items: Record<string, unknown> = { [KEYS.schema]: SCHEMA_VERSION };
        if (hasLegacy) {
          const converted = convertLegacy(legacy);
          items[KEYS.settings] = converted.settings ?? DEFAULT_SETTINGS;
          items[KEYS.library] = parseLibrary({ ...EMPTY_LIBRARY, ...converted.library });
        }
        await local.set(items);
        // Old keys are left in place for one release so a downgrade still finds its data.
      }),
  };
}
