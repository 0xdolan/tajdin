/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import type { Station } from "../../shared/types/station";
import { usePlayerStore } from "./playerStore";

const PL_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("usePlayerStore session restore", () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it("restoreResolvedStation fills station and keeps playlistContext", () => {
    usePlayerStore.setState({
      stationuuid: "s1",
      station: null,
      streamUrl: null,
      playlistContext: { playlistId: PL_ID, stationIndex: 2 },
    });
    const st: Station = {
      stationuuid: "s1",
      name: "X",
      url: "https://x.test/a",
      url_resolved: "https://x.test/a",
    };
    usePlayerStore.getState().restoreResolvedStation(st);
    const s = usePlayerStore.getState();
    expect(s.station?.name).toBe("X");
    expect(s.streamUrl).toBe("https://x.test/a");
    expect(s.playlistContext).toEqual({ playlistId: PL_ID, stationIndex: 2 });
  });
});
