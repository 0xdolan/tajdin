import { describe, expect, it } from 'vitest';
import {
  addToCollection,
  createGroup,
  createPlaylist,
  deleteCustomStation,
  EMPTY_LIBRARY,
  makeCustomStation,
  moveInPlaylist,
  normaliseLanguage,
  parseLibrary,
  parseSettings,
  DEFAULT_SETTINGS,
  stationFromUrl,
  toggleFavourite,
  type Station,
} from '../src';

const station = (id: string, source: Station['source'] = 'radio-browser'): Station => ({
  id,
  source,
  name: id,
  streamUrl: `https://example.com/${id}`,
  languages: [],
  tags: [],
});

describe('languages', () => {
  it.each([
    ['Kurmanji', 'ku'],
    ['sorani', 'ku'],
    ['کوردی', 'ku'],
    ['ckb', 'ku'],
    ['ENGLISH', 'en'],
    ['en-US', 'en'],
    ['Kurdî', 'ku'],
    ['Old Norse', 'old-norse'],
    ['eng', 'en'],
    ['per', 'fa'],
  ])('%s → %s', (raw, code) => expect(normaliseLanguage(raw)).toBe(code));
});

describe('settings', () => {
  it('falls back per field instead of discarding everything', () => {
    const s = parseSettings({ theme: 'dark', searchMode: 'bogus', preferredBitrate: 999 });
    expect(s.theme).toBe('dark');
    expect(s.searchMode).toBe(DEFAULT_SETTINGS.searchMode);
    expect(s.preferredBitrate).toBe('auto');
  });
});

describe('library', () => {
  it('drops invalid items and keeps valid ones', () => {
    const lib = parseLibrary({
      favourites: ['rb:a', 'rb:a', 3],
      customStations: [{ bad: true }, station('custom:x', 'custom')],
    });
    expect(lib.favourites).toEqual(['rb:a']);
    expect(lib.customStations).toHaveLength(1);
  });

  it('caches directory stations only while referenced', () => {
    const s = station('rb:1');
    let lib = toggleFavourite(EMPTY_LIBRARY, s);
    expect(lib.stationCache['rb:1']).toBeDefined();
    lib = toggleFavourite(lib, s);
    expect(lib.favourites).toEqual([]);
    expect(lib.stationCache['rb:1']).toBeUndefined();
  });

  it('reorders playlists and dedupes additions', () => {
    const { library, playlist } = createPlaylist(EMPTY_LIBRARY, { name: ' Morning ' });
    expect(playlist.name).toBe('Morning');
    let lib = addToCollection(library, 'playlist', playlist.id, [
      station('rb:1'),
      station('rb:2'),
      station('rb:3'),
    ]);
    lib = addToCollection(lib, 'playlist', playlist.id, [station('rb:2')]);
    lib = moveInPlaylist(lib, playlist.id, 0, 2);
    expect(lib.playlists[0]!.stationIds).toEqual(['rb:2', 'rb:3', 'rb:1']);
  });

  it('removes a deleted custom station everywhere', () => {
    const custom = makeCustomStation({ name: 'Mine', streamUrl: 'https://s.example/live' });
    const { library, group } = createGroup(
      { ...EMPTY_LIBRARY, customStations: [custom] },
      { kind: 'manual', name: 'G' },
    );
    let lib = addToCollection(library, 'group', group.id, [custom]);
    lib = toggleFavourite(lib, custom);
    lib = deleteCustomStation(lib, custom.id);
    expect(lib.customStations).toEqual([]);
    expect(lib.favourites).toEqual([]);
    expect(lib.groups[0]!.stationIds).toEqual([]);
  });

  it('creates language groups', () => {
    const { group } = createGroup(EMPTY_LIBRARY, {
      kind: 'language',
      name: 'Kurdish',
      language: 'ku',
    });
    expect(group).toMatchObject({ kind: 'language', language: 'ku' });
  });
});

describe('station factories', () => {
  it('rejects non-http schemes', () => {
    expect(() => makeCustomStation({ name: 'x', streamUrl: 'javascript:alert(1)' })).toThrow();
    expect(() =>
      makeCustomStation({
        name: 'x',
        streamUrl: 'https://ok.example',
        favicon: 'data:image/png;base64,AA',
      }),
    ).toThrow();
    expect(stationFromUrl('ftp://x')).toBeUndefined();
  });

  it('names link stations after their host', () => {
    expect(stationFromUrl('https://radio.example.com/live.mp3')?.name).toBe(
      'radio.example.com · live.mp3',
    );
  });
});
