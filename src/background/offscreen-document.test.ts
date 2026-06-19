import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureOffscreenDocument, waitUntilOffscreenReady } from "./offscreen-document";

describe("ensureOffscreenDocument", () => {
  const hasDocument = vi.fn();
  const createDocument = vi.fn();

  beforeEach(() => {
    hasDocument.mockReset();
    createDocument.mockReset();
    vi.stubGlobal("chrome", {
      offscreen: {
        hasDocument,
        createDocument,
        Reason: { AUDIO_PLAYBACK: "AUDIO_PLAYBACK" },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips create when a document already exists", async () => {
    hasDocument.mockResolvedValue(true);
    await ensureOffscreenDocument();
    expect(createDocument).not.toHaveBeenCalled();
  });

  it("creates AUDIO_PLAYBACK offscreen page when none exists", async () => {
    hasDocument.mockResolvedValue(false);
    createDocument.mockResolvedValue(undefined);
    await ensureOffscreenDocument();
    expect(createDocument).toHaveBeenCalledWith({
      url: "src/offscreen/index.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: expect.stringContaining("radio"),
    });
  });

  it("treats as success if create races but hasDocument becomes true", async () => {
    hasDocument.mockResolvedValueOnce(false).mockResolvedValue(true);
    createDocument.mockRejectedValue(new Error("already exists"));
    await expect(ensureOffscreenDocument()).resolves.toBeUndefined();
  });
});

describe("waitUntilOffscreenReady", () => {
  const hasDocument = vi.fn();
  const createDocument = vi.fn();
  const sendMessage = vi.fn();

  beforeEach(() => {
    hasDocument.mockReset();
    createDocument.mockReset();
    sendMessage.mockReset();
    vi.stubGlobal("chrome", {
      offscreen: {
        hasDocument,
        createDocument,
        Reason: { AUDIO_PLAYBACK: "AUDIO_PLAYBACK" },
      },
      runtime: { sendMessage },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns after the offscreen page responds to ping", async () => {
    hasDocument.mockResolvedValue(true);
    sendMessage.mockResolvedValueOnce({ ok: true, paused: true });
    await expect(waitUntilOffscreenReady()).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenCalledWith({ type: "tajdin/offscreen/ping" });
  });

  it("retries ping until the listener is ready", async () => {
    hasDocument.mockResolvedValue(true);
    sendMessage
      .mockRejectedValueOnce(new Error("Receiving end does not exist"))
      .mockResolvedValueOnce({ ok: true, paused: true });
    await expect(waitUntilOffscreenReady()).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });
});
