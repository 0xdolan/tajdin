import type { Playlist } from "../types/playlist";
import { DEFAULT_SETTINGS, type Settings } from "../types/settings";
import type { Station } from "../types/station";
import { beforeEach, describe, expect, it, vi } from "vitest";

const defaultSettingsSnapshot = (): Settings => ({
  theme: "system",
  popupWidthPx: 400,
  popupHeightPx: 600,
  searchMode: "exact",
  preferredBitrateKbps: "auto",
  playbackAutostart: false,
});

const store = vi.hoisted(() => ({
  settings: {
    theme: "system",
    popupWidthPx: 400,
    popupHeightPx: 600,
    searchMode: "exact",
    preferredBitrateKbps: "auto" as const,
    playbackAutostart: false,
  } as Settings,
  playlists: [] as Playlist[],
  customStations: [] as Station[],
  favouriteIds: [] as string[],
}));

vi.mock("../storage/instances", () => ({
  STORAGE_KEYS: {
    playlists: "tajdin.playlists.v1",
    customStations: "tajdin.customStations.v1",
    favouriteIds: "tajdin.favouriteIds.v1",
    settings: "tajdin.settings.v1",
    sessionPlayer: "tajdin.session.player.v1",
    sessionUi: "tajdin.session.ui.v1",
  },
  localPlaylistsStorage: {
    getWithDefault: vi.fn(async () => [...store.playlists]),
    set: vi.fn(async (_k: string, v: Playlist[]) => {
      store.playlists = [...v];
      return { success: true, data: v };
    }),
  },
  localCustomStationsStorage: {
    getWithDefault: vi.fn(async () => [...store.customStations]),
    set: vi.fn(async (_k: string, v: Station[]) => {
      store.customStations = [...v];
      return { success: true, data: v };
    }),
  },
  localFavouriteIdsStorage: {
    getWithDefault: vi.fn(async () => [...store.favouriteIds]),
    set: vi.fn(async (_k: string, v: string[]) => {
      store.favouriteIds = [...v];
      return { success: true, data: v };
    }),
  },
  localSettingsStorage: {
    getWithDefault: vi.fn(async () => ({ ...store.settings })),
    set: vi.fn(async (_k: string, v: Settings) => {
      store.settings = { ...v };
      return { success: true, data: v };
    }),
  },
}));

import {
  applyBackupMerge,
  applyBackupReplace,
  buildBackupFile,
  buildImportPreview,
  parseBackupJsonText,
  readLocalDataSnapshot,
} from "./backup-io";

describe("parseBackupJsonText", () => {
  it("rejects invalid JSON", () => {
    const r = parseBackupJsonText("{");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/valid JSON/i);
  });

  it("rejects wrong format", () => {
    const r = parseBackupJsonText(JSON.stringify({ format: "other", version: 1, exportedAt: "", data: { favouriteIds: [] } }));
    expect(r.ok).toBe(false);
  });

  it("rejects empty data object", () => {
    const r = parseBackupJsonText(
      JSON.stringify({
        format: "zeng-backup",
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        data: {},
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("accepts minimal backup with favouriteIds only", () => {
    const r = parseBackupJsonText(
      JSON.stringify({
        format: "zeng-backup",
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        data: { favouriteIds: ["a", "b"] },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.data.favouriteIds).toEqual(["a", "b"]);
  });

  it("accepts tajdin-backup format label", () => {
    const r = parseBackupJsonText(
      JSON.stringify({
        format: "tajdin-backup",
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        data: { favouriteIds: ["x"] },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.format).toBe("tajdin-backup");
  });
});

describe("buildImportPreview", () => {
  const local = {
    settings: DEFAULT_SETTINGS,
    playlists: [] as Playlist[],
    customStations: [] as Station[],
    favouriteIds: ["s1"] as string[],
  };

  it("merge shows added favourites", () => {
    const p = buildImportPreview(local, { favouriteIds: ["s1", "s2"] }, "merge");
    expect(p.sections.favourites.detail).toMatch(/\+1/);
  });

  it("replace shows counts for playlists", () => {
    const pl: Playlist[] = [
      {
        id: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
        name: "P",
        stationUuids: [],
        lastModified: "2026-01-01T00:00:00.000Z",
      },
    ];
    const p = buildImportPreview({ ...local, playlists: pl }, { playlists: [] }, "replace");
    expect(p.sections.playlists.state).toBe("replace");
    if (p.sections.playlists.state === "replace") {
      expect(p.sections.playlists.before).toBe(1);
      expect(p.sections.playlists.after).toBe(0);
    }
  });

  it("notes legacy groups in backup as ignored", () => {
    const p = buildImportPreview(
      local,
      {
        groups: [
          {
            id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            name: "G",
            stationUuids: [],
            iconKey: "musical-note",
            lastModified: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
      "merge",
    );
    expect(p.sections.groups.detail).toMatch(/no longer supported/i);
  });
});

describe("applyBackupReplace and applyBackupMerge", () => {
  beforeEach(() => {
    store.settings = defaultSettingsSnapshot();
    store.playlists = [];
    store.customStations = [];
    store.favouriteIds = [];
  });

  it("replace clears playlists when file has empty playlists", async () => {
    store.playlists = [
      {
        id: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
        name: "P",
        stationUuids: [],
        lastModified: "2026-01-01T00:00:00.000Z",
      },
    ];
    const ok = await applyBackupReplace({
      playlists: [],
      favouriteIds: [],
    });
    expect(ok).toBe(true);
    expect(store.playlists).toHaveLength(0);
  });

  it("merge unions favourites and keeps local-only", async () => {
    store.favouriteIds = ["a", "b"];
    const ok = await applyBackupMerge({ favouriteIds: ["b", "c"] });
    expect(ok).toBe(true);
    expect(store.favouriteIds).toEqual(["a", "b", "c"]);
  });

  it("merge overlays playlist with same id", async () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    store.playlists = [
      { id, name: "Old", stationUuids: [], lastModified: "2026-01-01T00:00:00.000Z" },
    ];
    const ok = await applyBackupMerge({
      playlists: [{ id, name: "New", stationUuids: ["x"], lastModified: "2026-02-01T00:00:00.000Z" }],
    });
    expect(ok).toBe(true);
    expect(store.playlists).toHaveLength(1);
    expect(store.playlists[0]!.name).toBe("New");
    expect(store.playlists[0]!.stationUuids).toEqual(["x"]);
  });
});

describe("readLocalDataSnapshot + buildBackupFile", () => {
  beforeEach(() => {
    store.settings = defaultSettingsSnapshot();
    store.playlists = [];
    store.customStations = [];
    store.favouriteIds = ["z"];
  });

  it("roundtrips through JSON parse", async () => {
    const snap = await readLocalDataSnapshot();
    const file = buildBackupFile(snap);
    const text = JSON.stringify(file);
    const r = parseBackupJsonText(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.file.data.favouriteIds).toEqual(["z"]);
  });

  it("export omits groups key", async () => {
    const snap = await readLocalDataSnapshot();
    const file = buildBackupFile(snap);
    expect(file.data).not.toHaveProperty("groups");
  });

  it("export uses tajdin-backup format", async () => {
    const snap = await readLocalDataSnapshot();
    const file = buildBackupFile(snap);
    expect(file.format).toBe("tajdin-backup");
  });
});
