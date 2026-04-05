import { describe, expect, it } from "vitest";
import {
  KURDISH_CURATED_STATION_ID_PREFIX,
  KURDISH_CURATED_STATIONS,
  getKurdishCuratedStationByUuid,
} from "./kurdishCuratedStations";

describe("kurdishCuratedStations", () => {
  it("exposes a non-empty validated list with stable ids", () => {
    expect(KURDISH_CURATED_STATIONS.length).toBeGreaterThan(30);
    for (const s of KURDISH_CURATED_STATIONS) {
      expect(s.stationuuid.startsWith(KURDISH_CURATED_STATION_ID_PREFIX)).toBe(true);
      expect(s.url.trim()).toBe(s.url);
    }
  });

  it("resolves by uuid", () => {
    const first = KURDISH_CURATED_STATIONS[0];
    expect(getKurdishCuratedStationByUuid(first.stationuuid)?.name).toBe(first.name);
    expect(getKurdishCuratedStationByUuid("unknown")).toBeUndefined();
  });
});
