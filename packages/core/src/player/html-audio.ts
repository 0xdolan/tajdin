import { isLocalStation, type AnyStation, type Station } from '../model/station';
import type { NowPlaying } from '../sources/types';
import { looksLikeHls, upgradeToHttps } from '../util/url';
import { readIcyOnce } from './icy';
import type { AudioBackend, AudioEvent } from './types';

export interface HtmlAudioOptions {
  /** Maps `local:<id>` to an object URL for a file handed to this document. */
  resolveLocal: (id: string) => string | undefined;
  /** Web build: upgrade http streams to https, since the page itself is https. */
  httpsOnly?: boolean;
  /** Song info from the directory (SomaFM, laut.fm); preferred over reading the stream. */
  directoryNowPlaying?: (station: Station, signal: AbortSignal) => Promise<NowPlaying | undefined>;
  /** Whether the directory can answer for this station, so ICY isn't tried needlessly. */
  hasDirectoryNowPlaying?: (station: Station) => boolean;
  /** Whether reading ICY metadata from the stream is possible here (needs CORS-free fetch). */
  canReadIcy?: boolean;
}

const STALL_TIMEOUT_MS = 20_000;
const NOW_PLAYING_INTERVAL_MS = 20_000;

type HlsInstance = {
  destroy(): void;
  loadSource(src: string): void;
  attachMedia(el: HTMLMediaElement): void;
  on(event: string, cb: (e: unknown, data: { fatal?: boolean }) => void): void;
};

let volumeSupport: boolean | undefined;

/**
 * Whether the page can change playback volume. iOS Safari keeps `volume` at 1 (the hardware
 * buttons control it), so there the UI offers mute only.
 */
export function supportsVolumeControl(): boolean {
  if (volumeSupport !== undefined) return volumeSupport;
  if (typeof Audio === 'undefined') return (volumeSupport = true);
  try {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeSupport = Math.abs(probe.volume - 0.5) < 0.01;
  } catch {
    volumeSupport = true;
  }
  return volumeSupport;
}

/** {@link AudioBackend} on an HTMLAudioElement, with hls.js loaded on demand for .m3u8 streams. */
export class HtmlAudioBackend implements AudioBackend {
  readonly audio: HTMLAudioElement;
  private readonly listeners = new Set<(e: AudioEvent) => void>();
  private hls: HlsInstance | null = null;
  private station: AnyStation | null = null;
  private stallTimer: ReturnType<typeof setTimeout> | undefined;
  private nowPlayingEnabled = false;
  private nowPlayingTimer: ReturnType<typeof setInterval> | undefined;
  private nowPlayingAbort: AbortController | null = null;
  private loadToken = 0;

  constructor(private readonly options: HtmlAudioOptions) {
    this.audio = new Audio();
    this.audio.preload = 'none';
    const a = this.audio;
    a.addEventListener('loadstart', () => this.loading());
    a.addEventListener('waiting', () => this.loading());
    a.addEventListener('playing', () => {
      this.clearStall();
      this.emit({ type: 'playing' });
      this.startNowPlaying();
    });
    a.addEventListener('pause', () => {
      if (!a.ended) this.emit({ type: 'paused' });
    });
    a.addEventListener('ended', () => this.emit({ type: 'ended' }));
    // Clearing `src` on stop/switch also fires `error`; only a real source failure counts.
    a.addEventListener('error', () => {
      if (a.getAttribute('src') || this.hls) this.fail();
    });
    a.addEventListener('timeupdate', () => {
      if (Number.isFinite(a.duration))
        this.emit({ type: 'time', position: a.currentTime, duration: a.duration });
    });
  }

  subscribe(listener: (e: AudioEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  load(station: AnyStation) {
    this.station = station;
    this.attach(this.sourceUrl(station));
  }

  async play() {
    if (!this.station) return;
    this.loading();
    try {
      await this.audio.play();
    } catch (error) {
      // Autoplay blocks are reported as a pause, so the UI shows a play button instead of an error.
      if ((error as DOMException)?.name === 'NotAllowedError') this.emit({ type: 'paused' });
      else if ((error as DOMException)?.name !== 'AbortError') this.fail();
    }
  }

  pause() {
    this.clearStall();
    this.audio.pause();
    this.stopNowPlaying();
  }

  stop() {
    this.clearStall();
    this.stopNowPlaying();
    this.detach();
    this.station = null;
  }

  /**
   * Volume 0 uses the element's real mute switch: iOS Safari ignores `volume` (the device buttons
   * control it) but does honour `muted`, so mute works everywhere.
   */
  setVolume(volume: number) {
    this.audio.muted = volume === 0;
    if (volume > 0) this.audio.volume = volume;
  }

  setRate(rate: number) {
    this.audio.playbackRate = rate;
    this.audio.preservesPitch = true;
  }

  seek(position: number) {
    if (Number.isFinite(this.audio.duration))
      this.audio.currentTime = Math.max(0, Math.min(position, this.audio.duration));
  }

  setNowPlayingEnabled(enabled: boolean) {
    this.nowPlayingEnabled = enabled;
    if (enabled && !this.audio.paused) this.startNowPlaying();
    else this.stopNowPlaying();
  }

  private sourceUrl(station: AnyStation): string {
    if (isLocalStation(station))
      return this.options.resolveLocal(station.streamUrl.slice('local:'.length)) ?? '';
    return this.options.httpsOnly ? upgradeToHttps(station.streamUrl) : station.streamUrl;
  }

  private attach(url: string) {
    this.detach();
    const token = ++this.loadToken;
    if (!url) {
      queueMicrotask(() => this.emit({ type: 'error', message: 'File is no longer available' }));
      return;
    }
    const station = this.station;
    const isHls = !!station && !isLocalStation(station) && (station.hls || looksLikeHls(url));
    if (isHls && !this.audio.canPlayType('application/vnd.apple.mpegurl')) {
      void import('hls.js').then(
        ({ default: Hls }) => {
          if (token !== this.loadToken) return;
          if (!Hls.isSupported()) return this.fail();
          const hls = new Hls({ lowLatencyMode: true }) as unknown as HlsInstance;
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) this.fail();
          });
          hls.loadSource(url);
          hls.attachMedia(this.audio);
          this.hls = hls;
        },
        () => this.fail(),
      );
      return;
    }
    this.audio.src = url;
  }

  private detach() {
    this.hls?.destroy();
    this.hls = null;
    this.audio.removeAttribute('src');
    this.audio.load();
  }

  private loading() {
    this.emit({ type: 'loading' });
    this.clearStall();
    this.stallTimer = setTimeout(() => this.fail(), STALL_TIMEOUT_MS);
  }

  private fail() {
    this.clearStall();
    if (!this.station) return;
    this.stopNowPlaying();
    this.emit({ type: 'error', message: 'Stream failed' });
  }

  private clearStall() {
    if (this.stallTimer) clearTimeout(this.stallTimer);
    this.stallTimer = undefined;
  }

  private startNowPlaying() {
    this.stopNowPlaying();
    const station = this.station;
    if (!this.nowPlayingEnabled || !station || isLocalStation(station)) return;
    const viaDirectory = this.options.hasDirectoryNowPlaying?.(station) ?? false;
    if (!viaDirectory && !this.options.canReadIcy) return;
    const poll = async () => {
      this.nowPlayingAbort?.abort();
      const abort = new AbortController();
      this.nowPlayingAbort = abort;
      try {
        const result = viaDirectory
          ? await this.options.directoryNowPlaying?.(station, abort.signal)
          : await readIcyOnce(this.sourceUrl(station), abort.signal);
        if (!abort.signal.aborted && this.station?.id === station.id) {
          this.emit({ type: 'metadata', nowPlaying: result ?? null });
        }
      } catch {
        /* song info is best-effort */
      }
    };
    void poll();
    this.nowPlayingTimer = setInterval(poll, NOW_PLAYING_INTERVAL_MS);
  }

  private stopNowPlaying() {
    if (this.nowPlayingTimer) clearInterval(this.nowPlayingTimer);
    this.nowPlayingTimer = undefined;
    this.nowPlayingAbort?.abort();
    this.nowPlayingAbort = null;
  }

  private emit(event: AudioEvent) {
    for (const l of this.listeners) l(event);
  }
}
