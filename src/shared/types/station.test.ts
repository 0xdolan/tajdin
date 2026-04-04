import { describe, expect, it } from "vitest";
import { StationSchema } from "./station";

describe("StationSchema", () => {
  it("parses a minimal station payload", () => {
    const parsed = StationSchema.parse({
      stationuuid: "123e4567-e89b-12d3-a456-426614174000",
      name: "Example FM",
      url: "https://example.com/stream",
    });
    expect(parsed.name).toBe("Example FM");
  });

  it("accepts custom-prefixed stationuuid", () => {
    const parsed = StationSchema.parse({
      stationuuid: "custom:my-station",
      name: "My stream",
      url: "https://stream.example/radio",
    });
    expect(parsed.stationuuid).toBe("custom:my-station");
  });

  it("accepts optional coverUrl on custom stations", () => {
    const parsed = StationSchema.parse({
      stationuuid: "custom:x",
      name: "Mine",
      url: "https://s.example/stream",
      coverUrl: "https://cdn.example/cover.jpg",
    });
    expect(parsed.coverUrl).toBe("https://cdn.example/cover.jpg");
  });

  it("parses Radio Browser–like fields and keeps unknown keys", () => {
    const parsed = StationSchema.parse({
      changeuuid: "ignored-but-kept",
      stationuuid: "abc",
      name: "RB Station",
      url: "http://stream",
      url_resolved: "http://stream/resolved",
      tags: "jazz,news",
      country: "United States",
      countrycode: "US",
      language: "English",
      languagecodes: "en",
      codec: "MP3",
      bitrate: 128,
      votes: 10,
      clickcount: 100,
      clicktrend: 2,
      lastcheckok: 1,
      lastchecktime: "2026-01-01T00:00:00Z",
      geo_lat: 40.7,
      geo_long: -74.0,
      ssl_error: 0,
      hls: 0,
      has_extended_info: true,
    });
    expect(parsed.bitrate).toBe(128);
    expect((parsed as Record<string, unknown>).changeuuid).toBe("ignored-but-kept");
  });

  it("rejects empty stationuuid", () => {
    expect(() =>
      StationSchema.parse({
        stationuuid: "",
        name: "X",
        url: "https://x.test",
      }),
    ).toThrow();
  });
});
