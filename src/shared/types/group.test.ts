import { describe, expect, it } from "vitest";
import { GroupSchema } from "./group";

describe("GroupSchema", () => {
  const base = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Favourites bucket",
    stationUuids: ["custom:a", "custom:b"],
    lastModified: "2026-04-04T10:00:00.000Z",
  };

  it("parses a minimal group", () => {
    const g = GroupSchema.parse(base);
    expect(g.name).toBe("Favourites bucket");
    expect(g.stationUuids).toHaveLength(2);
  });

  it("allows empty stationUuids", () => {
    const g = GroupSchema.parse({ ...base, stationUuids: [] });
    expect(g.stationUuids).toEqual([]);
  });

  it("accepts optional iconKey", () => {
    const g = GroupSchema.parse({ ...base, iconKey: "musical-note" });
    expect(g.iconKey).toBe("musical-note");
  });

  it("rejects invalid id", () => {
    expect(() => GroupSchema.parse({ ...base, id: "nope" })).toThrow();
  });

  it("rejects empty name", () => {
    expect(() => GroupSchema.parse({ ...base, name: "" })).toThrow();
  });
});
