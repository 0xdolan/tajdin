/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { playStationFromList } from "./browseNavigation";
import { usePlayerStore } from "./store/playerStore";
import type { Station } from "../shared/types/station";

const startPlayback = vi.fn();

vi.mock("./playerPlayback", () => ({
  startPlaybackWithPlaylistSkip: () => startPlayback(),
}));

const resolveStationForLibrary = vi.fn();

vi.mock("./stationLibraryApi", () => ({
  resolveStationForLibrary: (...args: unknown[]) => resolveStationForLibrary(...args),
}));

describe("browseNavigation", () => {
  beforeEach(() => {
    startPlayback.mockReset();
    startPlayback.mockResolvedValue(true);
    resolveStationForLibrary.mockReset();
    resolveStationForLibrary.mockResolvedValue(null);
    usePlayerStore.getState().resetPlayer();
  });

  it("resolves a station without a stream URL before setStation and play", async () => {
    resolveStationForLibrary.mockResolvedValue({
      stationuuid: "uuid-1",
      name: "Demo",
      url: "",
      url_resolved: "https://stream.example/live",
    } satisfies Station);

    await playStationFromList({
      stationuuid: "uuid-1",
      name: "Demo",
      url: "",
    } as Station);

    expect(resolveStationForLibrary).toHaveBeenCalledWith(expect.anything(), "uuid-1");
    expect(usePlayerStore.getState().streamUrl).toBe("https://stream.example/live");
    expect(startPlayback).toHaveBeenCalledTimes(1);
  });

  it("does not call resolve when the station already has a URL", async () => {
    await playStationFromList({
      stationuuid: "uuid-1",
      name: "Demo",
      url: "https://stream.example/direct",
    });

    expect(resolveStationForLibrary).not.toHaveBeenCalled();
    expect(startPlayback).toHaveBeenCalledTimes(1);
  });
});
