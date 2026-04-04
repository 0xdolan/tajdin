import {
  registerKeepAliveAlarmListener,
  tryHandlePlayerMessage,
} from "./audio-engine";
import { ensureOffscreenDocument, pingOffscreenAudio } from "./offscreen-document";
import { ensureLegacyStorageMigrated } from "../shared/storage/storage-migration";

async function startBackground(): Promise<void> {
  try {
    await ensureLegacyStorageMigrated();
  } catch {
    // Popup/settings run the same migration on open if SW migration fails.
  }

  registerKeepAliveAlarmListener();

  chrome.runtime.onInstalled.addListener(() => {
    void ensureLegacyStorageMigrated();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (tryHandlePlayerMessage(message, sendResponse)) {
      return true;
    }
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
}

void startBackground();
