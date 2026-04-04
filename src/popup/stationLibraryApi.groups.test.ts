import type { Group } from "../shared/types/group";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => {
  let groups: Group[] = [];
  return {
    reset() {
      groups = [];
    },
    snapshot() {
      return groups;
    },
    apply(next: Group[]) {
      groups = structuredClone(next);
    },
  };
});

vi.mock("../shared/storage/instances", () => ({
  STORAGE_KEYS: {
    playlists: "zeng.playlists.v1",
    groups: "zeng.groups.v1",
    customStations: "zeng.customStations.v1",
  },
  localCustomStationsStorage: {
    getWithDefault: vi.fn(async (_key: string, def: unknown[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
  localGroupsStorage: {
    getWithDefault: vi.fn(async (_key: string, def: Group[]) =>
      store.snapshot().length ? structuredClone(store.snapshot()) : def,
    ),
    set: vi.fn(async (_key: string, val: Group[]) => {
      store.apply(val);
      return { success: true };
    }),
  },
  localPlaylistsStorage: {
    getWithDefault: vi.fn(async (_key: string, def: unknown[]) => def),
    set: vi.fn(async () => ({ success: true })),
  },
}));

import {
  appendStationToGroup,
  createGroup,
  deleteGroup,
  loadPlaylistsAndGroups,
  setGroupIconKey,
} from "./stationLibraryApi";

describe("stationLibraryApi groups", () => {
  beforeEach(() => {
    store.reset();
    vi.clearAllMocks();
  });

  it("allows the same station in multiple groups", async () => {
    const g1 = await createGroup("Rock");
    const g2 = await createGroup("Favourites");
    expect(g1).not.toBeNull();
    expect(g2).not.toBeNull();
    await appendStationToGroup("station-uuid-1", g1!.id);
    await appendStationToGroup("station-uuid-1", g2!.id);
    const { groups } = await loadPlaylistsAndGroups();
    expect(groups.find((g) => g.id === g1!.id)?.stationUuids).toContain("station-uuid-1");
    expect(groups.find((g) => g.id === g2!.id)?.stationUuids).toContain("station-uuid-1");
  });

  it("deleteGroup removes only the group row, not other groups’ members", async () => {
    const g1 = await createGroup("A");
    const g2 = await createGroup("B");
    await appendStationToGroup("s-shared", g1!.id);
    await appendStationToGroup("s-shared", g2!.id);
    await deleteGroup(g1!.id);
    const { groups } = await loadPlaylistsAndGroups();
    expect(groups.some((g) => g.id === g1!.id)).toBe(false);
    expect(groups.find((g) => g.id === g2!.id)?.stationUuids).toEqual(["s-shared"]);
  });

  it("createGroup stores a valid icon key and defaults invalid keys", async () => {
    const heart = await createGroup("H", "heart");
    expect(heart?.iconKey).toBe("heart");
    const fallback = await createGroup("X", "not-real-icon");
    expect(fallback?.iconKey).toBe("folder");
  });

  it("setGroupIconKey rejects unknown keys", async () => {
    const g = await createGroup("Z");
    const ok = await setGroupIconKey(g!.id, "bogus");
    expect(ok).toBe(false);
  });
});
