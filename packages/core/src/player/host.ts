import type { Catalog } from '../sources/catalog';
import { languageLabel } from '../model/languages';
import { HtmlAudioBackend } from './html-audio';
import { PlayerService } from './service';
import type { PlayerCommand, PlayerState } from './types';

export interface PlayerHostOptions {
  catalog: Catalog;
  initial?: Partial<PlayerState>;
  onState: (state: PlayerState) => void;
  canReadIcy: boolean;
  httpsOnly?: boolean;
}

/** Files the user picked this session, keyed by the ID in their `local:<id>` stream URL. */
export class LocalFiles {
  private readonly urls = new Map<string, string>();

  add(id: string, file: Blob): void {
    this.remove(id);
    this.urls.set(id, URL.createObjectURL(file));
  }

  get(id: string): string | undefined {
    return this.urls.get(id);
  }

  remove(id: string): void {
    const url = this.urls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(id);
  }
}

/**
 * Everything that has to live next to the <audio> element: the player service, local files and
 * the OS media controls. The Chrome offscreen page, the Firefox background page and the web app
 * each create exactly one.
 */
export function createPlayerHost(options: PlayerHostOptions) {
  const files = new LocalFiles();
  const backend = new HtmlAudioBackend({
    resolveLocal: (id) => files.get(id),
    httpsOnly: options.httpsOnly,
    canReadIcy: options.canReadIcy,
    directoryNowPlaying: (station, signal) => options.catalog.nowPlaying(station, signal),
    hasDirectoryNowPlaying: (station) => options.catalog.hasDirectoryNowPlaying(station),
  });

  const onState = (state: PlayerState) => {
    updateMediaSession(state);
    options.onState(state);
  };
  const service = new PlayerService({
    backend,
    initial: options.initial,
    onState,
    onStarted: (station) => {
      if (station.source !== 'local' && station.source !== 'url' && station.source !== 'custom') {
        options.catalog.reportPlay(station);
      }
    },
  });

  bindMediaSession((command) => void service.dispatch(command));

  return {
    service,
    files,
    audio: backend.audio,
    dispatch: (command: PlayerCommand) => service.dispatch(command),
  };
}

export type PlayerHost = ReturnType<typeof createPlayerHost>;

function bindMediaSession(dispatch: (command: PlayerCommand) => void) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const handlers: [MediaSessionAction, PlayerCommand][] = [
    ['play', { type: 'resume' }],
    ['pause', { type: 'pause' }],
    ['stop', { type: 'stop' }],
    ['nexttrack', { type: 'next' }],
    ['previoustrack', { type: 'previous' }],
  ];
  for (const [action, command] of handlers) {
    try {
      navigator.mediaSession.setActionHandler(action, () => dispatch(command));
    } catch {
      /* action not supported by this browser */
    }
  }
}

function updateMediaSession(state: PlayerState) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const { station, nowPlaying } = state;
  if (!station) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    return;
  }
  const subtitle = station.country ?? (station.languages[0] ? languageLabel(station.languages[0]) : 'Tajdîn');
  navigator.mediaSession.metadata = new MediaMetadata({
    title: nowPlaying?.title ?? station.name,
    artist: nowPlaying ? (nowPlaying.artist ?? station.name) : subtitle,
    album: 'Tajdîn',
    artwork: station.favicon ? [{ src: station.favicon, sizes: '512x512' }] : [],
  });
  navigator.mediaSession.playbackState = state.status === 'playing' ? 'playing' : 'paused';
}
