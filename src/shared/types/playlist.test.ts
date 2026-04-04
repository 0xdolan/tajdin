import { describe, expect, it } from "vitest";
import { PlaylistSchema } from "./playlist";

describe("PlaylistSchema", () => {
  const base = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Morning mix",
    stationUuids: ["custom:one", "123e4567-e89b-12d3-a456-426614174000"],
    lastModified: "2026-04-03T12:00:00.000Z",
  };

  it("parses a minimal playlist", () => {
    const p = PlaylistSchema.parse(base);
    expect(p.name).toBe("Morning mix");
    expect(p.stationUuids).toHaveLength(2);
  });

  it("accepts optional description and colour", () => {
    const p = PlaylistSchema.parse({
      ...base,
      description: "Commute",
      colour: "#3b82f6",
    });
    expect(p.colour).toBe("#3b82f6");
  });

  it("allows empty station list", () => {
    const p = PlaylistSchema.parse({
      ...base,
      stationUuids: [],
    });
    expect(p.stationUuids).toEqual([]);
  });

  it("rejects invalid id", () => {
    expect(() =>
      PlaylistSchema.parse({
        ...base,
        id: "not-a-uuid",
      }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      PlaylistSchema.parse({
        ...base,
        name: "",
      }),
    ).toThrow();
  });

  it("rejects bad lastModified", () => {
    expect(() =>
      PlaylistSchema.parse({
        ...base,
        lastModified: "yesterday",
      }),
    ).toThrow();
  });
});
