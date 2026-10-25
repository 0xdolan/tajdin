import { useMemo, useState } from 'react';
import { foldKey, languageLabel, type SourceId, type Station } from '@tajdin/core';

export const SORTS = [
  { value: 'default', label: 'Default order' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'country', label: 'Country' },
  { value: 'language', label: 'Language' },
  { value: 'bitrate', label: 'Quality (highest first)' },
  { value: 'source', label: 'Source' },
] as const;
export type SortKey = (typeof SORTS)[number]['value'];

export interface ListTools {
  /** Narrows the loaded list by name, tags, country or language. */
  text: string;
  language: string;
  source: SourceId | '';
  sort: SortKey;
}

export const EMPTY_TOOLS: ListTools = { text: '', language: '', source: '', sort: 'default' };

export const SOURCE_NAMES: Record<SourceId, string> = {
  curated: 'Kurdish list',
  'radio-browser': 'Radio Browser',
  somafm: 'SomaFM',
  lautfm: 'laut.fm',
  custom: 'My stations',
  url: 'Links',
  local: 'Local files',
};

export function activeToolCount(tools: ListTools): number {
  return [tools.text.trim(), tools.language, tools.source, tools.sort !== 'default'].filter(Boolean)
    .length;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

/** Filters and sorts a list of stations on the client. Never reorders unless a sort is chosen. */
export function applyListTools(stations: Station[], tools: ListTools): Station[] {
  const needle = foldKey(tools.text.trim());
  let out = stations.filter((s) => {
    if (tools.language && !s.languages.includes(tools.language)) return false;
    if (tools.source && s.source !== tools.source) return false;
    if (!needle) return true;
    const haystack = [
      s.name,
      s.country ?? '',
      ...s.tags,
      ...s.languages.map(languageLabel),
      s.description ?? '',
    ]
      .map(foldKey)
      .join(' ');
    return haystack.includes(needle);
  });
  const by = (key: (s: Station) => string) => (a: Station, b: Station) =>
    collator.compare(key(a), key(b)) || collator.compare(a.name, b.name);
  switch (tools.sort) {
    case 'name':
      out = [...out].sort(by((s) => s.name));
      break;
    case 'name-desc':
      out = [...out].sort(by((s) => s.name)).reverse();
      break;
    case 'country':
      out = [...out].sort(by((s) => s.country ?? '\uffff'));
      break;
    case 'language':
      out = [...out].sort(by((s) => (s.languages[0] ? languageLabel(s.languages[0]) : '\uffff')));
      break;
    case 'bitrate':
      out = [...out].sort(
        (a, b) => (b.bitrate ?? -1) - (a.bitrate ?? -1) || collator.compare(a.name, b.name),
      );
      break;
    case 'source':
      out = [...out].sort(by((s) => SOURCE_NAMES[s.source]));
      break;
  }
  return out;
}

/** Languages and sources that actually occur in a list, for the filter menus. */
export function facets(stations: Station[]) {
  const languages = new Map<string, number>();
  const sources = new Map<SourceId, number>();
  for (const s of stations) {
    for (const l of s.languages) languages.set(l, (languages.get(l) ?? 0) + 1);
    sources.set(s.source, (sources.get(s.source) ?? 0) + 1);
  }
  return {
    languages: [...languages]
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, label: languageLabel(code), count })),
    sources: [...sources]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, label: SOURCE_NAMES[id], count })),
  };
}

/**
 * Filter/sort state for one list. When `resetKey` changes (another list is shown), the tools
 * start fresh, so a filter never silently hides stations in the next list.
 */
export function useListTools(stations: Station[], resetKey = '') {
  const [state, setState] = useState<{ key: string; tools: ListTools }>({
    key: resetKey,
    tools: EMPTY_TOOLS,
  });
  const tools = state.key === resetKey ? state.tools : EMPTY_TOOLS;
  const setTools = (next: ListTools) => setState({ key: resetKey, tools: next });
  const shown = useMemo(() => applyListTools(stations, tools), [stations, tools]);
  const available = useMemo(() => facets(stations), [stations]);
  return {
    tools,
    setTools,
    shown,
    available,
    active: activeToolCount(tools),
    reset: () => setTools(EMPTY_TOOLS),
  };
}
