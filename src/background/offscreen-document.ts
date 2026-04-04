import type { TajdinOffscreenPingResponse } from "../shared/messages/offscreen";

const OFFSCREEN_PAGE = "src/offscreen/index.html";

/**
 * Ensures the offscreen audio document exists (idempotent).
 * Uses {@link chrome.offscreen.Reason.AUDIO_PLAYBACK}.
 */
export async function ensureOffscreenDocument(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PAGE,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification:
        "Decode and play streaming radio audio when the popup is closed or the service worker has no visible UI.",
    });
  } catch {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
    throw new Error("Failed to create Tajdîn offscreen document");
  }
}

/** Create offscreen page if needed, then ping its audio listener. */
export async function pingOffscreenAudio(): Promise<TajdinOffscreenPingResponse> {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage({ type: "tajdin/offscreen/ping" }) as Promise<TajdinOffscreenPingResponse>;
}
