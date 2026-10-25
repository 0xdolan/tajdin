import { describe, expect, it } from 'vitest';
import { createMemoryArea, createRepository, KEYS } from '../src';

const LEGACY = {
  'tajdin.settings.v1': {
    theme: 'dark',
    searchMode: 'fuzzy',
    playbackAutostart: true,
    popupWidthPx: 400,
    popupHeightPx: 600,
    preferredBitrateKbps: 128,
  },
  'tajdin.favouriteIds.v1': [
    '9617a958-0601-11e8-ae97-52543be04c81',
    'tajdin:kurdish:3',
    'custom:abc',
  ],
  'tajdin.playlists.v1': [
    {
      id: '5b1c1a4e-7a52-4a1b-8f0e-2f1f5f6a7b8c',
      name: 'Drive',
      stationUuids: ['tajdin:kurdish:1'],
      lastModified: '2025-01-01T00:00:00.000Z',
    },
  ],
  'tajdin.customStations.v1': [
    {
      stationuuid: 'custom:abc',
      name: 'Home',
      url: 'http://home.example:8000/',
      coverUrl: 'https://img.example/c.png',
    },
  ],
};

describe('migration from 0.0.x', () => {
  it('converts every section and maps legacy IDs', async () => {
    const area = createMemoryArea(LEGACY);
    const repo = createRepository(area);
    await repo.migrate();
    const lib = await repo.getLibrary();
    const settings = await repo.getSettings();
    expect(lib.favourites).toEqual([
      'rb:9617a958-0601-11e8-ae97-52543be04c81',
      'ku:3',
      'custom:abc',
    ]);
    expect(lib.playlists[0]).toMatchObject({ name: 'Drive', stationIds: ['ku:1'] });
    expect(lib.customStations[0]).toMatchObject({
      id: 'custom:abc',
      source: 'custom',
      favicon: 'https://img.example/c.png',
    });
    expect(settings).toMatchObject({
      theme: 'dark',
      searchMode: 'exact',
      playOnSelect: true,
      preferredBitrate: 128,
    });
  });

  it('runs once and never overwrites newer data', async () => {
    const area = createMemoryArea(LEGACY);
    const repo = createRepository(area);
    await repo.migrate();
    await repo.updateLibrary((l) => ({ ...l, favourites: ['rb:new'] }));
    await repo.migrate();
    expect((await repo.getLibrary()).favourites).toEqual(['rb:new']);
  });

  it('also reads the pre-rename "zeng" keys', async () => {
    const repo = createRepository(createMemoryArea({ 'zeng.favouriteIds.v1': ['abc'] }));
    await repo.migrate();
    expect((await repo.getLibrary()).favourites).toEqual(['rb:abc']);
  });

  it('starts fresh installs with defaults', async () => {
    const area = createMemoryArea();
    await createRepository(area).migrate();
    expect(await area.get([KEYS.library])).toEqual({});
  });
});
