import { describe, expect, it } from "vitest";
import type { Station } from "../types/station";
import { mergeStationsDedupe } from "./station-merge";

const a = (uuid: string, name: string): Station => ({
  stationuuid: uuid,
  name,
  url: "http://x",
});

describe("mergeStationsDedupe", () => {
  it("prefers earlier entries and dedupes by uuid", () => {
    const m = mergeStationsDedupe([a("1", "First")], [a("1", "Dup"), a("2", "Second")]);
    expect(m).toHaveLength(2);
    expect(m[0]!.name).toBe("First");
    expect(m[1]!.stationuuid).toBe("2");
  });
});
