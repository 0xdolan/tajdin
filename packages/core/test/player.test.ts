import { describe, expect, it, vi } from 'vitest';
import { PlayerService, type AudioBackend, type AudioEvent, type Station } from '../src';

function fakeBackend() {
  const listeners = new Set<(e: AudioEvent) => void>();
  const loaded: string[] = [];
  const backend: AudioBackend & { emit(e: AudioEvent): void; loaded: string[] } = {
    loaded,
    load: (s) => void loaded.push(s.id),
    play: vi.fn(async () => undefined),
    pause: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
    setRate: vi.fn(),
    seek: vi.fn(),
    setNowPlayingEnabled: vi.fn(),
    subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
    emit: (e) => listeners.forEach((l) => l(e)),
  };
  return backend;
}

const st = (id: string): Station => ({
  id,
  source: 'radio-browser',
  name: id,
  streamUrl: `https://x/${id}`,
  languages: [],
  tags: [],
});
const queue = [st('a'), st('b'), st('c')];
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('PlayerService', () => {
  it('moves through the queue and wraps when the user asks', async () => {
    const backend = fakeBackend();
    const player = new PlayerService({ backend });
    await player.dispatch({
      type: 'play',
      station: queue[2]!,
      queue,
      context: { kind: 'playlist', label: 'P' },
    });
    await player.dispatch({ type: 'next' });
    expect(player.getState().station?.id).toBe('a');
    await player.dispatch({ type: 'previous' });
    expect(player.getState().station?.id).toBe('c');
  });

  it('skips failed stations in a list and reports when none work', async () => {
    const backend = fakeBackend();
    const player = new PlayerService({ backend });
    await player.dispatch({
      type: 'play',
      station: queue[0]!,
      queue,
      context: { kind: 'playlist', label: 'Drive' },
    });
    backend.emit({ type: 'error', message: 'x' });
    await flush();
    expect(player.getState().station?.id).toBe('b');
    backend.emit({ type: 'error', message: 'x' });
    await flush();
    backend.emit({ type: 'error', message: 'x' });
    await flush();
    expect(player.getState()).toMatchObject({ status: 'error' });
    expect(player.getState().error).toContain('Drive');
  });

  it('a single station errors straight away', async () => {
    const backend = fakeBackend();
    const player = new PlayerService({ backend });
    await player.dispatch({ type: 'play', station: queue[0]! });
    backend.emit({ type: 'error', message: 'x' });
    await flush();
    expect(player.getState().status).toBe('error');
  });

  it('mute keeps the last volume for unmute', async () => {
    const backend = fakeBackend();
    const player = new PlayerService({ backend });
    await player.dispatch({ type: 'setVolume', volume: 0.4 });
    await player.dispatch({ type: 'toggleMute' });
    expect(player.getState()).toMatchObject({ muted: true, volume: 0.4 });
    await player.dispatch({ type: 'toggleMute' });
    expect(backend.setVolume).toHaveBeenLastCalledWith(0.4);
  });

  it('random never repeats the current station when there is a choice', async () => {
    const backend = fakeBackend();
    const player = new PlayerService({ backend });
    await player.dispatch({ type: 'play', station: queue[0]!, queue });
    for (let i = 0; i < 20; i++) {
      const before = player.getState().station?.id;
      await player.dispatch({ type: 'random' });
      expect(player.getState().station?.id).not.toBe(before);
    }
  });

  it('cycles repeat off → all → one → off', async () => {
    const player = new PlayerService({ backend: fakeBackend() });
    const seen = [];
    for (let i = 0; i < 3; i++) {
      await player.dispatch({ type: 'cycleRepeat' });
      seen.push(player.getState().repeat);
    }
    expect(seen).toEqual(['all', 'one', 'off']);
  });

  it('restored sessions come back paused, never auto-playing', () => {
    const backend = fakeBackend();
    const player = new PlayerService({
      backend,
      initial: { station: queue[0]!, status: 'playing' },
    });
    expect(player.getState().status).toBe('paused');
    expect(backend.play).not.toHaveBeenCalled();
  });
});
