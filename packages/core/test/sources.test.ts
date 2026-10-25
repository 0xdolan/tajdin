import { describe, expect, it } from 'vitest';
import { createCatalog, CURATED_STATIONS, fromRadioBrowser, literalHint, parseIcyBlock } from '../src';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('curated list', () => {
  it('loads every bundled Kurdish station with a valid URL', () => {
    expect(CURATED_STATIONS.length).toBeGreaterThan(30);
    for (const s of CURATED_STATIONS) {
      expect(s.id).toMatch(/^ku:/);
      expect(s.languages).toEqual(['ku']);
      expect(s.streamUrl).toMatch(/^https?:\/\//);
    }
  });
});

describe('Radio Browser', () => {
  it('maps rows and drops malformed ones', () => {
    const s = fromRadioBrowser({
      stationuuid: 'u1',
      name: '  Radio\u0000 One ',
      url: 'http://a',
      url_resolved: 'https://b/stream',
      languagecodes: 'ku,en',
      language: 'kurdish,english',
      tags: 'News,news,Talk',
      favicon: 'javascript:alert(1)',
    });
    expect(s).toMatchObject({ id: 'rb:u1', name: 'Radio One', streamUrl: 'https://b/stream', languages: ['ku', 'en'], tags: ['news', 'talk'] });
    expect(s?.favicon).toBeUndefined();
    expect(fromRadioBrowser({ stationuuid: 'u2', name: 'x', url: 'ftp://nope' })).toBeUndefined();
  });

  it('fails over to the next mirror on 503', async () => {
    const hosts: string[] = [];
    const catalog = createCatalog({
      fetch: async (url) => {
        hosts.push(new URL(url).host);
        return hosts.length === 1 ? json({}, 503) : json([{ stationuuid: 'x', name: 'X', url: 'https://x' }]);
      },
    });
    const page = await catalog.sources['radio-browser'].search({ text: 'x', mode: 'exact', language: '', offset: 0, limit: 10, hideBroken: true, minBitrate: 0, httpsOnly: false });
    expect(page.stations).toHaveLength(1);
    expect(hosts[0]).not.toBe(hosts[1]);
  });
});

describe('catalog', () => {
  it('keeps working when one directory is down', async () => {
    const catalog = createCatalog({ fetch: async () => json({}, 500) });
    const mix = await catalog.mix({ sources: ['curated', 'somafm'], language: '', count: 10, hideBroken: true });
    expect(mix.length).toBeGreaterThan(0);
    expect(mix.every((s) => s.source === 'curated')).toBe(true);
  });

  it('only offers https streams on the web', async () => {
    const catalog = createCatalog({ httpsOnly: true, fetch: async () => json({}, 500) });
    const mix = await catalog.mix({ sources: ['curated'], language: 'ku', count: 50, hideBroken: true });
    expect(mix.every((s) => s.streamUrl.startsWith('https://'))).toBe(true);
  });

  it('resolves library IDs locally before using the network', async () => {
    let calls = 0;
    const catalog = createCatalog({ fetch: async () => (calls++, json([])) });
    const ku = CURATED_STATIONS[0]!;
    const { stations } = await catalog.resolve([ku.id], { favourites: [], playlists: [], groups: [], customStations: [], stationCache: {} });
    expect(stations).toEqual([ku]);
    expect(calls).toBe(0);
  });
});

describe('helpers', () => {
  it.each([
    ['^radio\\s+(kurd|kurdistan)', 'kurdistan'],
    ['\\p{L}+fm', 'fm'],
    ['.*', ''],
  ])('literal hint of %s is %s', (pattern, hint) => expect(literalHint(pattern)).toBe(hint));

  it('parses ICY titles', () => {
    expect(parseIcyBlock("StreamTitle='Şivan Perwer - Kîne Em';StreamUrl='';")).toEqual({ artist: 'Şivan Perwer', title: 'Kîne Em' });
    expect(parseIcyBlock("StreamTitle='';")).toBeNull();
  });
});
