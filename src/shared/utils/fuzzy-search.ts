import Fuse from "fuse.js";
import type { Station } from "../types/station";

const FUSE_KEYS: (keyof Station)[] = [
  "name",
  "tags",
  "country",
  "language",
  "codec",
  "countrycode",
];

const fuseOptions = {
  keys: FUSE_KEYS,
  threshold: 0.4,
  ignoreLocation: true,
} as const;

/**
 * Fuzzy rank/filter stations with Fuse.js (threshold 0.4 per PRD).
 * Empty `query` returns a shallow copy of the input list.
 */
export function fuzzySearchStations(
  stations: readonly Station[],
  query: string,
): Station[] {
  const q = query.trim();
  if (!q) return [...stations];
  const fuse = new Fuse(stations, fuseOptions);
  return fuse.search(q).map((r) => r.item);
}

export type RegexSearchStationsResult =
  | { ok: true; stations: Station[] }
  | { ok: false; error: string };

function stationHaystacks(s: Station): string[] {
  return [
    s.name,
    s.tags,
    s.country,
    s.language,
    s.codec,
    s.countrycode,
    s.homepage,
    s.url_resolved,
    s.url,
  ].filter((x): x is string => typeof x === "string" && x.length > 0);
}

/**
 * Filter stations with a user-provided RegExp pattern. Invalid patterns return `ok: false`.
 */
export function regexSearchStations(
  stations: readonly Station[],
  pattern: string,
): RegexSearchStationsResult {
  const p = pattern.trim();
  if (!p) return { ok: true, stations: [...stations] };
  try {
    const re = new RegExp(p, "iu");
    const out = stations.filter((s) =>
      stationHaystacks(s).some((h) => re.test(h)),
    );
    return { ok: true, stations: out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
