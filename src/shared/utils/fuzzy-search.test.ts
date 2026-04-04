import { describe, expect, it } from "vitest";
import type { Station } from "../types/station";
import { fuzzySearchStations, regexSearchStations } from "./fuzzy-search";

function station(partial: Partial<Station> & Pick<Station, "stationuuid" | "name" | "url">): Station {
  return {
    tags: "",
    country: "",
    language: "",
    ...partial,
  };
}

describe("fuzzySearchStations", () => {
  it("returns all stations when query is empty", () => {
    const list = [
      station({ stationuuid: "a", name: "Alpha", url: "http://a" }),
      station({ stationuuid: "b", name: "Beta", url: "http://b" }),
    ];
    expect(fuzzySearchStations(list, "   ")).toEqual(list);
  });

  it("matches by name with fuzzy tolerance", () => {
    const list = [
      station({ stationuuid: "1", name: "Classic FM Radio", url: "http://1" }),
      station({ stationuuid: "2", name: "Totally Unrelated", url: "http://2" }),
    ];
    const out = fuzzySearchStations(list, "Clasic");
    expect(out.map((s) => s.stationuuid)).toContain("1");
    expect(out.map((s) => s.stationuuid)).not.toContain("2");
  });

  it("can match tags and country fields", () => {
    const list = [
      station({
        stationuuid: "1",
        name: "X",
        url: "http://1",
        tags: "jazz,smooth",
        country: "Germany",
      }),
      station({ stationuuid: "2", name: "Y", url: "http://2", tags: "rock" }),
    ];
    const byTag = fuzzySearchStations(list, "jaz");
    expect(byTag.some((s) => s.stationuuid === "1")).toBe(true);
    const byCountry = fuzzySearchStations(list, "germ");
    expect(byCountry.some((s) => s.stationuuid === "1")).toBe(true);
  });
});

describe("regexSearchStations", () => {
  it("returns all stations when pattern is empty", () => {
    const list = [station({ stationuuid: "a", name: "A", url: "http://a" })];
    const r = regexSearchStations(list, "");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stations).toEqual(list);
    }
  });

  it("filters by valid regex across haystacks", () => {
    const list = [
      station({ stationuuid: "1", name: "Jazz Night", url: "http://1" }),
      station({ stationuuid: "2", name: "News 24", url: "http://2" }),
    ];
    const r = regexSearchStations(list, "jazz");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stations.map((s) => s.stationuuid)).toEqual(["1"]);
    }
  });

  it("returns ok false for invalid patterns", () => {
    const list = [station({ stationuuid: "a", name: "A", url: "http://a" })];
    const r = regexSearchStations(list, "[");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.length).toBeGreaterThan(0);
    }
  });
});
