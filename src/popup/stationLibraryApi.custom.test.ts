import type { RadioBrowserClient } from "../shared/api/radio-browser.api";
import type { Station } from "../shared/types/station";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  custom: [] as Station[],
}));

vi.mock("../shared/storage/instances", () => ({
  STORAGE_KEYS: {
    playlists: "zeng.playlists.v1",
    groups: "zeng.groups.v1",
    customStations: "zeng.customStations.v1",
  },
  localPlaylistsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: unknown[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
  localGroupsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: unknown[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
  localCustomStationsStorage: {
    getWithDefault: vi.fn(async (_k: string, def: Station[]) =>
      store.custom.length ? [...store.custom] : def,
    ),
    set: vi.fn(async (_k: string, val: Station[]) => {
      store.custom = [...val];
      return { success: true };
    }),
  },
}));

import {
  addCustomStation,
  loadCustomStations,
  removeCustomStation,
  resolveStationForLibrary,
} from "./stationLibraryApi";

describe("custom stations", () => {
  beforeEach(() => {
    store.custom = [];
  });

  it("addCustomStation uses custom: uuid prefix and https", async () => {
    const st = await addCustomStation("My Stream", "https://stream.example/live");
    expect(st).not.toBeNull();
    expect(st!.stationuuid.startsWith("custom:")).toBe(true);
    expect(st!.url).toBe("https://stream.example/live");
    const list = await loadCustomStations();
    expect(list).toHaveLength(1);
  });

  it("addCustomStation returns null for invalid URL", async () => {
    expect(await addCustomStation("X", "ftp://a")).toBeNull();
  });

  it("removeCustomStation drops the row and returns false for unknown uuid", async () => {
    const a = await addCustomStation("A", "https://a.example/s");
    const b = await addCustomStation("B", "https://b.example/s");
    expect(await loadCustomStations()).toHaveLength(2);
    expect(await removeCustomStation("custom:00000000-0000-4000-8000-000000000000")).toBe(false);
    expect(await loadCustomStations()).toHaveLength(2);
    expect(await removeCustomStation(a!.stationuuid)).toBe(true);
    const rest = await loadCustomStations();
    expect(rest).toHaveLength(1);
    expect(rest[0]!.stationuuid).toBe(b!.stationuuid);
  });

  it("resolveStationForLibrary reads custom entries", async () => {
    const st = await addCustomStation("Local", "https://a.example/stream");
    const client = { fetchStationByUuid: vi.fn() } as unknown as RadioBrowserClient;
    const resolved = await resolveStationForLibrary(client, st!.stationuuid);
    expect(resolved?.name).toBe("Local");
    expect(client.fetchStationByUuid).not.toHaveBeenCalled();
  });
});
