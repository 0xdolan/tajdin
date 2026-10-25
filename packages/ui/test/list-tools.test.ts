import { describe, expect, it } from 'vitest';
import type { Station } from '@tajdin/core';
import { activeToolCount, applyListTools, EMPTY_TOOLS, facets } from '../src/app/list-tools';

const st = (id: string, extra: Partial<Station> = {}): Station => ({
  id,
  source: 'radio-browser',
  name: id,
  streamUrl: `https://x.example/${id}`,
  languages: [],
  tags: [],
  ...extra,
});

const stations = [
  st('Rudaw', { source: 'curated', languages: ['ku'], country: 'Iraq', bitrate: 64 }),
  st('Groove Salad', {
    source: 'somafm',
    languages: ['en'],
    tags: ['ambient'],
    country: 'United States',
    bitrate: 128,
  }),
  st('Dengê Welat', { source: 'curated', languages: ['ku'] }),
  st('Antenne', { languages: ['de'], country: 'Austria', bitrate: 320 }),
];

describe('list tools', () => {
  it('keeps the original order by default', () => {
    expect(applyListTools(stations, EMPTY_TOOLS)).toEqual(stations);
    expect(activeToolCount(EMPTY_TOOLS)).toBe(0);
  });

  it('filters by text across name, tags, country and language, ignoring accents', () => {
    const names = (text: string) =>
      applyListTools(stations, { ...EMPTY_TOOLS, text }).map((s) => s.name);
    expect(names('ambient')).toEqual(['Groove Salad']);
    expect(names('dengE')).toEqual(['Dengê Welat']);
    expect(names('kurdish')).toEqual(['Rudaw', 'Dengê Welat']);
    expect(names('austria')).toEqual(['Antenne']);
  });

  it('filters by language and source', () => {
    expect(applyListTools(stations, { ...EMPTY_TOOLS, language: 'ku' })).toHaveLength(2);
    expect(
      applyListTools(stations, { ...EMPTY_TOOLS, source: 'somafm' }).map((s) => s.name),
    ).toEqual(['Groove Salad']);
  });

  it('sorts by name, quality and country (missing values last)', () => {
    const sorted = (sort: (typeof EMPTY_TOOLS)['sort']) =>
      applyListTools(stations, { ...EMPTY_TOOLS, sort }).map((s) => s.name);
    expect(sorted('name')).toEqual(['Antenne', 'Dengê Welat', 'Groove Salad', 'Rudaw']);
    expect(sorted('name-desc')).toEqual(['Rudaw', 'Groove Salad', 'Dengê Welat', 'Antenne']);
    expect(sorted('bitrate')).toEqual(['Antenne', 'Groove Salad', 'Rudaw', 'Dengê Welat']);
    expect(sorted('country').at(-1)).toBe('Dengê Welat');
  });

  it('offers only the languages and sources that occur, most common first', () => {
    const f = facets(stations);
    expect(f.languages[0]).toMatchObject({ code: 'ku', count: 2 });
    expect(f.sources.map((s) => s.id)).toEqual(['curated', 'somafm', 'radio-browser']);
  });
});
