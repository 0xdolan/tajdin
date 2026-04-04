/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Station } from "../shared/types/station";
import { ensurePlayerStationResolved } from "./ensurePlayerStationResolved";
import { usePlayerStore } from "./store/playerStore";

const resolveStationForLibrary = vi.fn();

vi.mock("./stationLibraryApi", () => ({
  resolveStationForLibrary: (...args: unknown[]) => resolveStationForLibrary(...args),
}));

describe("ensurePlayerStationResolved", () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    resolveStationForLibrary.mockReset();
  });

  it("does not apply resolved station if stationuuid changed while fetching", async () => {
    usePlayerStore.setState({
      stationuuid: "uuid-a",
      station: null,
      streamUrl: null,
    });

    let finishResolve!: (s: Station | null) => void;
    const deferred = new Promise<Station | null>((resolve) => {
      finishResolve = resolve;
    });
    resolveStationForLibrary.mockReturnValue(deferred);

    const pending = ensurePlayerStationResolved();

    usePlayerStore.getState().setStation({
      stationuuid: "uuid-b",
      name: "Picked while fetch in flight",
      url: "https://b.example/stream",
      url_resolved: "https://b.example/stream",
    });

    finishResolve({
      stationuuid: "uuid-a",
      name: "Stale API",
      url: "https://a.example/stream",
      url_resolved: "https://a.example/stream",
    });

    await expect(pending).resolves.toBe(false);
    const s = usePlayerStore.getState();
    expect(s.stationuuid).toBe("uuid-b");
    expect(s.station?.name).toBe("Picked while fetch in flight");
  });

  it("after fetch, does not overwrite if same uuid already has playable station", async () => {
    usePlayerStore.setState({
      stationuuid: "uuid-a",
      station: null,
      streamUrl: null,
    });

    let finishResolve!: (s: Station | null) => void;
    const deferred = new Promise<Station | null>((resolve) => {
      finishResolve = resolve;
    });
    resolveStationForLibrary.mockReturnValue(deferred);

    const pending = ensurePlayerStationResolved();

    const rich: Station = {
      stationuuid: "uuid-a",
      name: "From list",
      country: "Testland",
      url: "https://a.example/stream",
      url_resolved: "https://a.example/stream",
    };
    usePlayerStore.getState().setStation(rich);

    finishResolve({
      stationuuid: "uuid-a",
      name: "API",
      url: "https://a.example/stream",
      url_resolved: "https://a.example/stream",
    });

    await expect(pending).resolves.toBe(true);
    const s = usePlayerStore.getState();
    expect(s.station?.name).toBe("From list");
    expect(s.station?.country).toBe("Testland");
  });
});
