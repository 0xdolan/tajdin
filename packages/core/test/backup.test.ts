import { describe, expect, it } from 'vitest';
import {
  addToCollection,
  applyImport,
  BackupError,
  createBackup,
  createPlaylist,
  DEFAULT_SETTINGS,
  EMPTY_LIBRARY,
  parseBackup,
  previewImport,
  toggleFavourite,
  type Station,
} from '../src';

const s = (id: string): Station => ({
  id,
  source: 'radio-browser',
  name: id,
  streamUrl: `https://x.example/${id}`,
  languages: [],
  tags: [],
});

describe('backup', () => {
  const { library: withPlaylist, playlist } = createPlaylist(EMPTY_LIBRARY, { name: 'P' });
  const library = toggleFavourite(
    addToCollection(withPlaylist, 'playlist', playlist.id, [s('rb:1')]),
    s('rb:2'),
  );

  it('round-trips everything, including station snapshots', () => {
    const file = JSON.stringify(
      createBackup({
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' },
        library,
        appVersion: '0.2.1',
      }),
    );
    const parsed = parseBackup(file);
    const result = applyImport(
      parsed,
      { settings: DEFAULT_SETTINGS, library: EMPTY_LIBRARY },
      'replace',
    );
    expect(result.settings.theme).toBe('dark');
    expect(result.library.playlists).toEqual(library.playlists);
    expect(result.library.favourites).toEqual(['rb:2']);
    expect(Object.keys(result.library.stationCache).sort()).toEqual(['rb:1', 'rb:2']);
  });

  it('merges: union of favourites, file wins on same ID, local-only kept', () => {
    const local = {
      ...toggleFavourite(EMPTY_LIBRARY, s('rb:9')),
      playlists: [{ ...playlist, name: 'Local name' }],
    };
    const parsed = parseBackup(
      JSON.stringify(
        createBackup({
          settings: DEFAULT_SETTINGS,
          library,
          appVersion: '0.2.1',
          sections: ['favourites', 'playlists'],
        }),
      ),
    );
    const preview = previewImport(parsed, local);
    expect(preview.find((p) => p.section === 'playlists')).toMatchObject({ updated: 1, added: 0 });
    expect(preview.find((p) => p.section === 'favourites')).toMatchObject({
      added: 1,
      localOnly: 1,
    });
    const result = applyImport(parsed, { settings: DEFAULT_SETTINGS, library: local }, 'merge');
    expect(result.library.favourites).toEqual(['rb:9', 'rb:2']);
    expect(result.library.playlists[0]!.name).toBe('P');
  });

  it('only touches the sections chosen', () => {
    const parsed = parseBackup(
      JSON.stringify(
        createBackup({
          settings: { ...DEFAULT_SETTINGS, theme: 'light' },
          library,
          appVersion: '0.2.1',
        }),
      ),
    );
    const local = toggleFavourite(EMPTY_LIBRARY, s('rb:9'));
    const result = applyImport(parsed, { settings: DEFAULT_SETTINGS, library: local }, 'replace', [
      'settings',
    ]);
    expect(result.settings.theme).toBe('light');
    expect(result.library.favourites).toEqual(['rb:9']);
  });

  it('reads 0.0.x backups, including the old "zeng-backup" name', () => {
    for (const format of ['tajdin-backup', 'zeng-backup']) {
      const parsed = parseBackup(
        JSON.stringify({
          format,
          version: 1,
          exportedAt: '2025-01-01',
          data: { favouriteIds: ['abc', 'tajdin:kurdish:2'] },
        }),
      );
      expect(parsed.library.favourites).toEqual(['rb:abc', 'ku:2']);
    }
  });

  it.each([
    ['not json', 'not valid JSON'],
    ['{"format":"other"}', 'not a Tajdîn backup'],
    ['{"format":"tajdin-backup","version":9,"exportedAt":"x","data":{}}', 'newer version'],
    ['{"format":"tajdin-backup","version":2,"exportedAt":"x","data":{}}', 'no data'],
    [
      '{"format":"tajdin-backup","version":2,"exportedAt":"x","data":{"playlists":[{"id":1}]}}',
      'damaged',
    ],
  ])('rejects %s', (text, message) => {
    expect(() => parseBackup(text)).toThrow(BackupError);
    expect(() => parseBackup(text)).toThrow(message);
  });
});
