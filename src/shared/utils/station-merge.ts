import type { Station } from "../types/station";

/** Dedupe by `stationuuid`; earlier entries win. */
export function mergeStationsDedupe(first: readonly Station[], second: readonly Station[]): Station[] {
  const seen = new Set<string>();
  const out: Station[] = [];
  for (const s of [...first, ...second]) {
    if (seen.has(s.stationuuid)) continue;
    seen.add(s.stationuuid);
    out.push(s);
  }
  return out;
}
