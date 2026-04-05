import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_VOLUME_PERCENT, usePlayerStore } from "./playerStore";

describe("usePlayerStore", () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it("resetPlayer uses default volume for first-run UX", () => {
    usePlayerStore.getState().setVolumePercent(12);
    usePlayerStore.getState().resetPlayer();
    expect(usePlayerStore.getState().volumePercent).toBe(DEFAULT_PLAYER_VOLUME_PERCENT);
  });

  it("setVolumePercent clamps to 0–100", () => {
    usePlayerStore.getState().setVolumePercent(150);
    expect(usePlayerStore.getState().volumePercent).toBe(100);
    usePlayerStore.getState().setVolumePercent(-10);
    expect(usePlayerStore.getState().volumePercent).toBe(0);
  });

  it("applySessionPlayer merges and skips identical session fields", () => {
    usePlayerStore.getState().applySessionPlayer({
      stationuuid: "abc",
      isPlaying: true,
      volumePercent: 40,
    });
    const s1 = usePlayerStore.getState();
    usePlayerStore.getState().applySessionPlayer({
      stationuuid: "abc",
      isPlaying: true,
      volumePercent: 40,
    });
    expect(usePlayerStore.getState()).toBe(s1);
  });

  it("setStation derives streamUrl and stationuuid", () => {
    usePlayerStore.getState().setStation({
      stationuuid: "u1",
      name: "X",
      url: "http://a",
      url_resolved: "http://b",
    });
    const s = usePlayerStore.getState();
    expect(s.stationuuid).toBe("u1");
    expect(s.streamUrl).toBe("http://b");
    expect(s.station?.name).toBe("X");
  });

  it("beginPlaylistPlayback sets context and setStation clears it", () => {
    const st = {
      stationuuid: "u1",
      name: "X",
      url: "http://a",
      url_resolved: "http://b",
    };
    usePlayerStore.getState().beginPlaylistPlayback(st, "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee", 2);
    expect(usePlayerStore.getState().playlistContext).toEqual({
      playlistId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      stationIndex: 2,
    });
    usePlayerStore.getState().setStation(st);
    expect(usePlayerStore.getState().playlistContext).toBeNull();
  });

  it("applySessionPlayer restores playlist context", () => {
    usePlayerStore.getState().applySessionPlayer({
      stationuuid: "zzzzzzzz-zzzz-4zzz-zzzz-zzzzzzzzzzzz",
      playlistId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      playlistStationIndex: 1,
    });
    expect(usePlayerStore.getState().playlistContext).toEqual({
      playlistId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      stationIndex: 1,
    });
  });
});
