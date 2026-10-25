import type { AnyStation } from '../model/station';
import type { NowPlaying } from '../sources/types';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

/** Where the current queue came from; shown in the player and used to word error messages. */
export interface QueueContext {
  kind: 'mix' | 'search' | 'favourites' | 'playlist' | 'group' | 'single';
  id?: string;
  label: string;
}

export interface PlayerState {
  station: AnyStation | null;
  status: PlaybackStatus;
  error: string | null;
  /** 0..1 */
  volume: number;
  muted: boolean;
  /** Playback speed; only applies to local files (see `supportsSpeed`). */
  rate: number;
  repeat: RepeatMode;
  queue: AnyStation[];
  index: number;
  context: QueueContext | null;
  nowPlaying: NowPlaying | null;
  /** Seconds, for seekable media only. */
  position: number;
  duration: number;
}

export const INITIAL_PLAYER_STATE: PlayerState = {
  station: null,
  status: 'idle',
  error: null,
  volume: 0.75,
  muted: false,
  rate: 1,
  repeat: 'off',
  queue: [],
  index: -1,
  context: null,
  nowPlaying: null,
  position: 0,
  duration: 0,
};

export type PlayerCommand =
  | { type: 'play'; station: AnyStation; queue?: AnyStation[]; context?: QueueContext }
  | { type: 'load'; station: AnyStation; queue?: AnyStation[]; context?: QueueContext }
  | { type: 'toggle' }
  | { type: 'resume' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'random' }
  | { type: 'setVolume'; volume: number }
  | { type: 'toggleMute' }
  | { type: 'setRate'; rate: number }
  | { type: 'setRepeat'; repeat: RepeatMode }
  | { type: 'cycleRepeat' }
  | { type: 'seek'; position: number }
  | { type: 'setNowPlaying'; enabled: boolean };

export type AudioEvent =
  | { type: 'loading' }
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'ended' }
  | { type: 'error'; message: string }
  | { type: 'time'; position: number; duration: number }
  | { type: 'metadata'; nowPlaying: NowPlaying | null };

/** The thing that actually makes sound: an <audio> element in an offscreen page, background page or tab. */
export interface AudioBackend {
  load(station: AnyStation): void;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  setRate(rate: number): void;
  seek(position: number): void;
  setNowPlayingEnabled(enabled: boolean): void;
  subscribe(listener: (event: AudioEvent) => void): () => void;
}

/** What UI code talks to. The extension implements it with messaging; the web app in-process. */
export interface PlayerClient {
  getState(): PlayerState;
  subscribe(listener: (state: PlayerState) => void): () => void;
  send(command: PlayerCommand): Promise<void>;
  /** Plays an audio file from the user's disk for this session only. */
  playFile(file: File): Promise<void>;
}

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
