import { supportsSpeed, type AnyStation } from '../model/station';
import { pickOne } from '../util/random';
import { INITIAL_PLAYER_STATE, type AudioBackend, type PlayerCommand, type PlayerState, type QueueContext } from './types';

const MAX_QUEUE = 500;
/** How often repeat-one reconnects a dropped live stream before giving up. */
const MAX_RECONNECTS = 3;

export interface PlayerServiceOptions {
  backend: AudioBackend;
  initial?: Partial<PlayerState>;
  /** Called with every new state; hosts persist and broadcast it. */
  onState?: (state: PlayerState) => void;
  /** Called once per successful start, e.g. to count a Radio Browser click. */
  onStarted?: (station: AnyStation) => void;
}

export function errorMessage(context: QueueContext | null, exhausted: boolean): string {
  if (exhausted && context && context.kind !== 'single') {
    return context.kind === 'playlist'
      ? `No station in “${context.label}” could be played. Edit the playlist or pick another station.`
      : `None of these stations could be played. Try another list or check your connection.`;
  }
  return 'This station can’t be played right now. Check your connection or pick another station.';
}

/**
 * Owns the queue and playback rules. Runs wherever the audio element lives, so playback keeps
 * going with every UI closed.
 */
export class PlayerService {
  private state: PlayerState;
  private readonly backend: AudioBackend;
  private failedInRow = 0;
  private reconnects = 0;
  private startedFor: string | null = null;

  constructor(private readonly options: PlayerServiceOptions) {
    this.backend = options.backend;
    this.state = {
      ...INITIAL_PLAYER_STATE,
      ...options.initial,
      // A restored session never resumes by itself; the browser would block it anyway.
      status: options.initial?.station ? 'paused' : 'idle',
      error: null,
      nowPlaying: null,
    };
    this.backend.setVolume(this.state.muted ? 0 : this.state.volume);
    if (this.state.station) this.backend.load(this.state.station);
    this.backend.subscribe((event) => {
      switch (event.type) {
        case 'loading':
          this.set({ status: 'loading', error: null });
          break;
        case 'playing':
          this.failedInRow = 0;
          this.reconnects = 0;
          this.set({ status: 'playing', error: null });
          if (this.state.station && this.startedFor !== this.state.station.id) {
            this.startedFor = this.state.station.id;
            this.options.onStarted?.(this.state.station);
          }
          break;
        case 'paused':
          if (this.state.status !== 'error') this.set({ status: 'paused' });
          break;
        case 'ended':
          void this.onEnded();
          break;
        case 'error':
          void this.onError();
          break;
        case 'time':
          this.set({ position: event.position, duration: event.duration });
          break;
        case 'metadata':
          this.set({ nowPlaying: event.nowPlaying });
          break;
      }
    });
  }

  getState(): PlayerState {
    return this.state;
  }

  async dispatch(command: PlayerCommand): Promise<void> {
    switch (command.type) {
      case 'play':
      case 'load': {
        const queue = (command.queue ?? [command.station]).slice(0, MAX_QUEUE);
        const index = Math.max(0, queue.findIndex((s) => s.id === command.station.id));
        this.failedInRow = 0;
        this.set({ queue, index, context: command.context ?? { kind: 'single', label: command.station.name } });
        return this.start(command.station, command.type === 'play');
      }
      case 'toggle':
        return this.state.status === 'playing' || this.state.status === 'loading' ? this.pause() : this.resume();
      case 'resume':
        return this.resume();
      case 'pause':
        return this.pause();
      case 'stop':
        this.backend.stop();
        this.set({ status: 'idle', station: null, error: null, nowPlaying: null, position: 0, duration: 0 });
        return;
      case 'next':
        return this.step(1, true);
      case 'previous':
        if (this.state.position > 5 && this.state.station?.source === 'local') {
          this.backend.seek(0);
          return;
        }
        return this.step(-1, true);
      case 'random': {
        const station = pickOne(this.state.queue, (s) => s.id === this.state.station?.id);
        if (!station) return;
        this.set({ index: this.state.queue.indexOf(station) });
        return this.start(station, true);
      }
      case 'setVolume': {
        const volume = clamp(command.volume, 0, 1);
        this.backend.setVolume(volume);
        this.set({ volume: volume || this.state.volume, muted: volume === 0 });
        return;
      }
      case 'toggleMute': {
        const muted = !this.state.muted;
        this.backend.setVolume(muted ? 0 : this.state.volume || INITIAL_PLAYER_STATE.volume);
        this.set({ muted, volume: this.state.volume || INITIAL_PLAYER_STATE.volume });
        return;
      }
      case 'setRate': {
        const rate = clamp(command.rate, 0.5, 2);
        if (supportsSpeed(this.state.station)) this.backend.setRate(rate);
        this.set({ rate });
        return;
      }
      case 'setRepeat':
        this.set({ repeat: command.repeat });
        return;
      case 'cycleRepeat':
        this.set({ repeat: this.state.repeat === 'off' ? 'all' : this.state.repeat === 'all' ? 'one' : 'off' });
        return;
      case 'seek':
        this.backend.seek(command.position);
        return;
      case 'setNowPlaying':
        this.backend.setNowPlayingEnabled(command.enabled);
        if (!command.enabled) this.set({ nowPlaying: null });
        return;
    }
  }

  private async start(station: AnyStation, autoplay: boolean) {
    this.set({ station, status: autoplay ? 'loading' : 'paused', error: null, nowPlaying: null, position: 0, duration: 0 });
    this.backend.load(station);
    this.backend.setRate(supportsSpeed(station) ? this.state.rate : 1);
    if (autoplay) await this.backend.play().catch(() => undefined);
  }

  private async resume() {
    const { station } = this.state;
    if (!station) {
      const first = this.state.queue[0];
      if (first) await this.start(first, true);
      return;
    }
    if (this.state.status === 'error') return this.start(station, true);
    this.set({ status: 'loading', error: null });
    // Live streams are reloaded so resuming starts at the live edge, not minutes behind.
    if (station.source !== 'local') this.backend.load(station);
    await this.backend.play().catch(() => undefined);
  }

  private pause() {
    this.backend.pause();
    this.set({ status: 'paused' });
  }

  /** Moves through the queue. `wrap` is true for user-initiated moves and for repeat-all. */
  private async step(direction: 1 | -1, userInitiated: boolean) {
    const { queue, index, repeat } = this.state;
    if (queue.length === 0) return;
    let nextIndex = index + direction;
    if (nextIndex >= queue.length || nextIndex < 0) {
      if (!userInitiated && repeat !== 'all') {
        this.set({ status: 'idle' });
        return;
      }
      nextIndex = (nextIndex + queue.length) % queue.length;
    }
    this.set({ index: nextIndex });
    await this.start(queue[nextIndex]!, true);
  }

  private async onEnded() {
    const { station, repeat } = this.state;
    if (!station) return;
    if (station.source !== 'local') {
      // A live stream "ending" means the connection dropped.
      return this.onError();
    }
    if (repeat === 'one') return this.start(station, true);
    return this.step(1, false);
  }

  private async onError() {
    const { station, queue, repeat, context } = this.state;
    if (!station) return;
    if (repeat === 'one' && this.reconnects < MAX_RECONNECTS) {
      this.reconnects++;
      await new Promise((r) => setTimeout(r, 1000 * this.reconnects));
      return this.start(station, true);
    }
    this.failedInRow++;
    // In a list, a dead station is skipped; the list wraps so every station gets one try.
    const inList = queue.length > 1 && context?.kind !== 'single';
    if (inList && this.failedInRow < queue.length) {
      const nextIndex = (this.state.index + 1) % queue.length;
      this.set({ index: nextIndex });
      return this.start(queue[nextIndex]!, true);
    }
    this.backend.stop();
    this.set({ status: 'error', error: errorMessage(context, inList) });
  }

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.options.onState?.(this.state);
  }
}

function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
