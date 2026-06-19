import type { TajdinOffscreenPingResponse } from "../shared/messages/offscreen";

const OFFSCREEN_PAGE = "src/offscreen/index.html";
const OFFSCREEN_READY_TIMEOUT_MS = 5000;
const OFFSCREEN_READY_INTERVAL_MS = 50;

async function tryPingOffscreen(): Promise<TajdinOffscreenPingResponse | null> {
  try {
    const res = (await chrome.runtime.sendMessage({
      type: "tajdin/offscreen/ping",
    })) as TajdinOffscreenPingResponse | undefined;
    if (res?.ok) return res;
  } catch {
    /* listener not registered yet */
  }
  return null;
}

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

/**
 * Create the offscreen page if needed, then wait until its message listener responds.
 * Avoids "Receiving end does not exist" races right after {@link chrome.offscreen.createDocument}.
 */
export async function waitUntilOffscreenReady(): Promise<void> {
  await ensureOffscreenDocument();
  const deadline = Date.now() + OFFSCREEN_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const pong = await tryPingOffscreen();
    if (pong) return;
    await new Promise((r) => setTimeout(r, OFFSCREEN_READY_INTERVAL_MS));
  }
  throw new Error("Tajdîn offscreen audio page did not respond in time");
}

/** Create offscreen page if needed, then ping its audio listener. */
export async function pingOffscreenAudio(): Promise<TajdinOffscreenPingResponse> {
  await waitUntilOffscreenReady();
  const pong = await tryPingOffscreen();
  if (!pong) {
    throw new Error("Tajdîn offscreen audio page did not respond to ping");
  }
  return pong;
}
