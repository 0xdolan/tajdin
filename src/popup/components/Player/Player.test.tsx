/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../../store/playerStore";
import { Player } from "./Player";

const TEST_PLAYLIST_ID = "550e8400-e29b-41d4-a716-446655440000";

const playlistLibMocks = vi.hoisted(() => ({
  loadPlaylistsForLibrary: vi.fn(),
  appendStationToPlaylist: vi.fn(),
  resolveStationForLibrary: vi.fn(),
}));

vi.mock("../../stationLibraryApi", () => ({
  loadPlaylistsForLibrary: playlistLibMocks.loadPlaylistsForLibrary,
  appendStationToPlaylist: playlistLibMocks.appendStationToPlaylist,
  resolveStationForLibrary: playlistLibMocks.resolveStationForLibrary,
}));

describe("Player", () => {
  const sendMessage = vi.fn();

  beforeEach(() => {
    sendMessage.mockReset();
    playlistLibMocks.loadPlaylistsForLibrary.mockResolvedValue({
      playlists: [
        {
          id: TEST_PLAYLIST_ID,
          name: "Test playlist",
          stationUuids: [],
          lastModified: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    playlistLibMocks.appendStationToPlaylist.mockResolvedValue(true);
    playlistLibMocks.resolveStationForLibrary.mockResolvedValue({
      stationuuid: "s1",
      name: "Demo FM",
      url: "http://stream.example/a",
      url_resolved: "http://stream.example/b",
    });
    usePlayerStore.getState().resetPlayer();
    usePlayerStore.getState().setStation({
      stationuuid: "s1",
      name: "Demo FM",
      url: "http://stream.example/a",
      url_resolved: "http://stream.example/b",
    });
    usePlayerStore.getState().setVolumePercent(80);
    usePlayerStore.getState().setMuted(false);

    sendMessage.mockImplementation(
      (
        msg: { type: string },
        cb: (r: {
          ok: boolean;
          result?: { type: string; data: { ok: boolean } };
          error?: string;
        }) => void,
      ) => {
        if (msg.type === "tajdin/player/load") {
          cb({ ok: true, result: { type: "tajdin/player/load", data: { ok: true } } });
          return;
        }
        if (msg.type === "tajdin/player/play") {
          cb({ ok: true, result: { type: "tajdin/player/play", data: { ok: true } } });
          return;
        }
        if (msg.type === "tajdin/player/pause") {
          cb({ ok: true, result: { type: "tajdin/player/pause", data: { ok: true as const } } });
          return;
        }
        if (msg.type === "tajdin/player/set-volume") {
          cb({ ok: true, result: { type: "tajdin/player/set-volume", data: { ok: true } } });
          return;
        }
        cb({ ok: false, error: "unknown" });
      },
    );

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage,
        lastError: undefined,
        getURL: (path: string) => `chrome-extension://test-id/${path}`,
      },
    });
  });

  it("sends set-volume when the slider changes and updates the store", () => {
    render(<Player />);
    const slider = screen.getByRole("slider", { name: /volume/i });
    fireEvent.change(slider, { target: { value: "50" } });
    expect(usePlayerStore.getState().volumePercent).toBe(50);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "tajdin/player/set-volume", volumePercent: 50 },
      expect.any(Function),
    );
  });

  it("shows packaged extension icon while playing", () => {
    usePlayerStore.getState().setStation({
      stationuuid: "s1",
      name: "Demo FM",
      url: "http://stream.example/a",
      url_resolved: "http://stream.example/b",
      favicon: "https://example.com/station-icon.png",
    });
    usePlayerStore.getState().setPlaying(true);
    render(<Player />);
    const img = document.querySelector(`img[src="chrome-extension://test-id/icons/tajdin-radio-50.png"]`);
    expect(img).toBeInTheDocument();
  });

  it("shows station favicon when stopped", () => {
    usePlayerStore.getState().setStation({
      stationuuid: "s1",
      name: "Demo FM",
      url: "http://stream.example/a",
      url_resolved: "http://stream.example/b",
      favicon: "https://example.com/station-icon.png",
    });
    usePlayerStore.getState().setPlaying(false);
    render(<Player />);
    const img = document.querySelector('img[src="https://example.com/station-icon.png"]');
    expect(img).toBeInTheDocument();
  });

  it("mute sends volume 0 and unmute restores stored level", async () => {
    const user = userEvent.setup();
    render(<Player />);
    await user.click(screen.getByRole("button", { name: /^mute$/i }));
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "tajdin/player/set-volume", volumePercent: 0 },
      expect.any(Function),
    );
    expect(usePlayerStore.getState().muted).toBe(true);
    await user.click(screen.getByRole("button", { name: /^unmute$/i }));
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "tajdin/player/set-volume", volumePercent: 80 },
      expect.any(Function),
    );
    expect(usePlayerStore.getState().muted).toBe(false);
  });

  it("disables add-to-playlist when no station is selected", () => {
    usePlayerStore.getState().resetPlayer();
    render(<Player />);
    expect(screen.getByRole("button", { name: /add current station to playlist/i })).toBeDisabled();
  });

  it("appends the current station to the chosen playlist from the player menu", async () => {
    const user = userEvent.setup();
    render(<Player />);
    await user.click(screen.getByRole("button", { name: /add current station to playlist/i }));
    await user.click(screen.getByRole("menuitem", { name: /test playlist/i }));
    expect(playlistLibMocks.appendStationToPlaylist).toHaveBeenCalledWith("s1", TEST_PLAYLIST_ID);
  });

  it("resolves a session-only stationuuid and starts playback when Play is pressed", async () => {
    const user = userEvent.setup();
    usePlayerStore.getState().resetPlayer();
    usePlayerStore.setState({
      stationuuid: "s1",
      station: null,
      streamUrl: null,
      isPlaying: false,
      volumePercent: 80,
      muted: false,
    });
    render(<Player />);
    await user.click(screen.getByRole("button", { name: /^play$/i }));
    expect(playlistLibMocks.resolveStationForLibrary).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalled();
  });
});
