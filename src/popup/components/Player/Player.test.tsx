/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../../store/playerStore";
import { Player } from "./Player";

describe("Player", () => {
  const sendMessage = vi.fn();

  beforeEach(() => {
    sendMessage.mockReset();
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
        if (msg.type === "zeng/player/load") {
          cb({ ok: true, result: { type: "zeng/player/load", data: { ok: true } } });
          return;
        }
        if (msg.type === "zeng/player/play") {
          cb({ ok: true, result: { type: "zeng/player/play", data: { ok: true } } });
          return;
        }
        if (msg.type === "zeng/player/pause") {
          cb({ ok: true, result: { type: "zeng/player/pause", data: { ok: true as const } } });
          return;
        }
        if (msg.type === "zeng/player/set-volume") {
          cb({ ok: true, result: { type: "zeng/player/set-volume", data: { ok: true } } });
          return;
        }
        cb({ ok: false, error: "unknown" });
      },
    );

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage,
        lastError: undefined,
      },
    });
  });

  it("sends set-volume when the slider changes and updates the store", () => {
    render(<Player />);
    const slider = screen.getByRole("slider", { name: /volume/i });
    fireEvent.change(slider, { target: { value: "50" } });
    expect(usePlayerStore.getState().volumePercent).toBe(50);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "zeng/player/set-volume", volumePercent: 50 },
      expect.any(Function),
    );
  });

  it("mute sends volume 0 and unmute restores stored level", async () => {
    const user = userEvent.setup();
    render(<Player />);
    await user.click(screen.getByRole("button", { name: /^mute$/i }));
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "zeng/player/set-volume", volumePercent: 0 },
      expect.any(Function),
    );
    expect(usePlayerStore.getState().muted).toBe(true);
    await user.click(screen.getByRole("button", { name: /^unmute$/i }));
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "zeng/player/set-volume", volumePercent: 80 },
      expect.any(Function),
    );
    expect(usePlayerStore.getState().muted).toBe(false);
  });
});
