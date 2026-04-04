import { ensureOffscreenDocument, pingOffscreenAudio } from "./offscreen-document";

chrome.runtime.onInstalled.addListener(() => {
  // Install / update hook (alarms, defaults) — expand in audio-engine task.
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "zeng/health-check") {
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === "zeng/sw/ensure-offscreen") {
    void ensureOffscreenDocument()
      .then(() => sendResponse({ ok: true as const }))
      .catch((e: unknown) =>
        sendResponse({ ok: false as const, error: e instanceof Error ? e.message : String(e) }),
      );
    return true;
  }
  if (message?.type === "zeng/sw/ping-offscreen") {
    void pingOffscreenAudio()
      .then((pong) => sendResponse({ ok: true as const, pong }))
      .catch((e: unknown) =>
        sendResponse({ ok: false as const, error: e instanceof Error ? e.message : String(e) }),
      );
    return true;
  }
  return false;
});
