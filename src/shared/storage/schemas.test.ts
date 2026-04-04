import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../types/settings";
import {
  LocalCustomStationsSchema,
  LocalFavouriteIdsSchema,
  LocalGroupsSchema,
  LocalPlaylistsSchema,
  LocalSettingsSchema,
  SessionPlayerSchema,
  SessionUiSchema,
} from "./schemas";

describe("local storage schemas", () => {
  it("LocalPlaylistsSchema accepts valid playlist array", () => {
    const parsed = LocalPlaylistsSchema.parse([
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "A",
        stationUuids: [],
        lastModified: "2026-04-04T00:00:00.000Z",
      },
    ]);
    expect(parsed).toHaveLength(1);
  });

  it("LocalGroupsSchema rejects invalid group", () => {
    expect(() => LocalGroupsSchema.parse([{ id: "bad", name: "G", stationUuids: [], lastModified: "x" }])).toThrow();
  });

  it("LocalCustomStationsSchema parses custom station", () => {
    const parsed = LocalCustomStationsSchema.parse([
      { stationuuid: "custom:1", name: "Mine", url: "https://s.test" },
    ]);
    expect(parsed[0].stationuuid).toBe("custom:1");
  });

  it("LocalCustomStationsSchema accepts coverUrl", () => {
    const parsed = LocalCustomStationsSchema.parse([
      {
        stationuuid: "custom:2",
        name: "With art",
        url: "https://s.test/a",
        coverUrl: "https://img.test/c.png",
      },
    ]);
    expect(parsed[0].coverUrl).toBe("https://img.test/c.png");
  });

  it("LocalFavouriteIdsSchema rejects empty id string", () => {
    expect(() => LocalFavouriteIdsSchema.parse([""])).toThrow();
  });

  it("LocalSettingsSchema parses default settings", () => {
    expect(LocalSettingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("session storage schemas", () => {
  it("SessionPlayerSchema accepts empty object", () => {
    expect(SessionPlayerSchema.parse({})).toEqual({});
  });

  it("SessionPlayerSchema accepts null station", () => {
    const p = SessionPlayerSchema.parse({ stationuuid: null, volumePercent: 50 });
    expect(p.stationuuid).toBeNull();
    expect(p.volumePercent).toBe(50);
  });

  it("SessionUiSchema accepts known tab", () => {
    expect(SessionUiSchema.parse({ activeTab: "browse" }).activeTab).toBe("browse");
  });

  it("SessionUiSchema maps legacy groups tab to browse", () => {
    expect(SessionUiSchema.parse({ activeTab: "groups" }).activeTab).toBe("browse");
  });

  it("SessionUiSchema maps legacy fuzzy browseSearchMode to exact", () => {
    expect(SessionUiSchema.parse({ browseSearchMode: "fuzzy" }).browseSearchMode).toBe("exact");
  });

  it("SessionUiSchema rejects unknown tab", () => {
    expect(() => SessionUiSchema.parse({ activeTab: "unknown" })).toThrow();
  });
});
