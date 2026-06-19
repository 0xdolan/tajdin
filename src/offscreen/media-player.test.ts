/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { assignAudioSource, playAudioWithRetry } from "./media-player";

describe("assignAudioSource", () => {
  let player: HTMLAudioElement;

  beforeEach(() => {
    player = document.createElement("audio");
    document.body.appendChild(player);
    vi.spyOn(player, "load").mockImplementation(() => {});
  });

  it("resolves after canplay", async () => {
    const p = assignAudioSource(player, "https://stream.example/live");
    player.dispatchEvent(new Event("canplay"));
    await expect(p).resolves.toBeUndefined();
    expect(player.src).toContain("stream.example");
  });

  it("rejects on error event", async () => {
    const p = assignAudioSource(player, "https://stream.example/bad");
    player.dispatchEvent(new Event("error"));
    await expect(p).rejects.toThrow(/failed to load/i);
  });
});

describe("playAudioWithRetry", () => {
  it("retries play when the first attempt fails", async () => {
    const player = document.createElement("audio");
    const play = vi
      .spyOn(player, "play")
      .mockRejectedValueOnce(new Error("not ready"))
      .mockResolvedValueOnce(undefined);
    await playAudioWithRetry(player, 3);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
