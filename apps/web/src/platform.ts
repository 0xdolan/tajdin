import {
  createCatalog,
  createPlayerHost,
  createRepository,
  createWebStorageArea,
  INITIAL_PLAYER_STATE,
  stationFromFile,
  uuid,
  type PlayerClient,
  type PlayerState,
} from '@tajdin/core';
import { STORE_LINKS, type Platform, type SettingsTab } from '@tajdin/ui/app';

const PLAYER_PREFS = 'tajdin.v2.web.player';

/**
 * The website plays in the page itself. It's served over https, so http streams are tried over
 * https (many hosts answer on both) and the station lists prefer https streams.
 */
function createWebPlayer(catalog: ReturnType<typeof createCatalog>): PlayerClient {
  let saved: Partial<PlayerState> = {};
  try {
    saved = JSON.parse(localStorage.getItem(PLAYER_PREFS) ?? '{}') as Partial<PlayerState>;
  } catch {
    /* private mode or corrupt value: start fresh */
  }
  const listeners = new Set<(s: PlayerState) => void>();
  let state: PlayerState = {
    ...INITIAL_PLAYER_STATE,
    volume: saved.volume ?? 0.75,
    repeat: saved.repeat ?? 'off',
  };
  const host = createPlayerHost({
    catalog,
    httpsOnly: true,
    // Browsers block cross-origin stream reads from web pages; song info comes from directories.
    canReadIcy: false,
    initial: { volume: state.volume, repeat: state.repeat },
    onState: (next) => {
      state = next;
      listeners.forEach((l) => l(state));
      try {
        localStorage.setItem(
          PLAYER_PREFS,
          JSON.stringify({ volume: next.volume, repeat: next.repeat }),
        );
      } catch {
        /* storage blocked */
      }
    },
  });
  state = host.service.getState();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    send: (command) => host.dispatch(command),
    async playFile(file) {
      const id = uuid();
      host.files.add(id, file);
      const station = stationFromFile(file, id);
      await host.dispatch({
        type: 'play',
        station,
        context: { kind: 'single', label: station.name },
      });
    },
  };
}

export function createWebPlatform(surface: 'desktop' | 'settings', version: string): Platform {
  const catalog = createCatalog({ httpsOnly: true });
  return {
    kind: 'web',
    surface,
    version,
    repository: createRepository(createWebStorageArea('local')),
    session: createWebStorageArea('session'),
    catalog,
    player: createWebPlayer(catalog),
    playsHttp: false,
    openSettings: (tab?: SettingsTab) => {
      location.hash = `settings/${tab ?? 'general'}`;
    },
    openDesktop: () => {
      location.hash = '';
    },
    storeLinks: STORE_LINKS.map(({ label, href }) => ({ label, href })),
  };
}
