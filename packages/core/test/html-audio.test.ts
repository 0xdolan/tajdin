import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('HtmlAudioBackend volume', () => {
  it('mutes with the element switch at 0 and restores the level after', async () => {
    const { HtmlAudioBackend } = await import('../src/player/html-audio');
    const backend = new HtmlAudioBackend({ resolveLocal: () => undefined });
    const { audio } = backend;

    backend.setVolume(0.4);
    expect(audio.muted).toBe(false);
    expect(audio.volume).toBeCloseTo(0.4);

    backend.setVolume(0);
    expect(audio.muted).toBe(true);
    expect(audio.volume).toBeCloseTo(0.4);

    backend.setVolume(0.7);
    expect(audio.muted).toBe(false);
    expect(audio.volume).toBeCloseTo(0.7);
  });

  it('reports volume control where the element accepts it', async () => {
    const { supportsVolumeControl } = await import('../src/player/html-audio');
    expect(supportsVolumeControl()).toBe(true);
  });

  it('reports no volume control on iOS, where volume stays at 1', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'volume', 'get').mockReturnValue(1);
    vi.spyOn(HTMLMediaElement.prototype, 'volume', 'set').mockImplementation(() => undefined);
    const { supportsVolumeControl } = await import('../src/player/html-audio');
    expect(supportsVolumeControl()).toBe(false);
  });
});
