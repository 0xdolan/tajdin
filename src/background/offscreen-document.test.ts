import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ensureOffscreenDocument } from "./offscreen-document";

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
