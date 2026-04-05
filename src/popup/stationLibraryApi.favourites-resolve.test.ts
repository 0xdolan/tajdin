import type { RadioBrowserClient } from "../shared/api/radio-browser.api";
import type { Station } from "../shared/types/station";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  custom: [] as Station[],
}));

vi.mock("../shared/storage/instances", () => ({
  STORAGE_KEYS: {
    playlists: "tajdin.playlists.v1",
    customStations: "tajdin.customStations.v1",
    favouriteIds: "tajdin.favouriteIds.v1",
  },
  localPlaylistsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: unknown[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
  localCustomStationsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: Station[]) =>
      store.custom.length ? [...store.custom] : def,
    ),
    set: vi.fn(async () => ({ success: true })),
  },
  localFavouriteIdsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: string[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
}));

import { resolveFavouriteStationsForLibrary } from "./stationLibraryApi";

const radioA: Station = {
  stationuuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "Radio A",
  url: "http://a.example/stream",
  url_resolved: "http://a.example/stream",
  tags: "",
  country: "X",
  votes: 1,
  bitrate: 128,
  lastcheckok: 1,
  hls: 0,
};

describe("resolveFavouriteStationsForLibrary", () => {
  beforeEach(() => {
    store.custom = [];
  });

  it("uses one fetchStationsByUuids for multiple radio ids and preserves order", async () => {
    const fetchStationsByUuids = vi.fn().mockResolvedValue(
      new Map<string, Station>([
        [radioA.stationuuid, radioA],
        [
          "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          { ...radioA, stationuuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Radio B" },
        ],
      ]),
    );
    const client = { fetchStationsByUuids } as unknown as RadioBrowserClient;

    const list = await resolveFavouriteStationsForLibrary(client, [
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      radioA.stationuuid,
    ]);

    expect(fetchStationsByUuids).toHaveBeenCalledTimes(1);
    expect(fetchStationsByUuids).toHaveBeenCalledWith([
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      radioA.stationuuid,
    ]);
    expect(list.map((s) => s.name)).toEqual(["Radio B", "Radio A"]);
  });

  it("resolves custom stations from a single storage read without calling the API", async () => {
    const custom: Station = {
      stationuuid: "custom:11111111-1111-1111-1111-111111111111",
      name: "My stream",
      url: "https://stream.example/x",
      url_resolved: "https://stream.example/x",
      tags: "custom",
    };
    store.custom = [custom];

    const fetchStationsByUuids = vi.fn();
    const client = { fetchStationsByUuids } as unknown as RadioBrowserClient;

    const list = await resolveFavouriteStationsForLibrary(client, [custom.stationuuid]);

    expect(fetchStationsByUuids).not.toHaveBeenCalled();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe("My stream");
  });

  it("mixes custom and radio in favourite order", async () => {
    const custom: Station = {
      stationuuid: "custom:22222222-2222-2222-2222-222222222222",
      name: "Custom",
      url: "https://c.example/s",
      url_resolved: "https://c.example/s",
      tags: "custom",
    };
    store.custom = [custom];

    const fetchStationsByUuids = vi.fn().mockResolvedValue(new Map([[radioA.stationuuid, radioA]]));
    const client = { fetchStationsByUuids } as unknown as RadioBrowserClient;

    const list = await resolveFavouriteStationsForLibrary(client, [radioA.stationuuid, custom.stationuuid]);

    expect(list.map((s) => s.stationuuid)).toEqual([radioA.stationuuid, custom.stationuuid]);
  });
});
