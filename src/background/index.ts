import {
  registerKeepAliveAlarmListener,
  tryHandlePlayerMessage,
} from "./audio-engine";
import { ensureOffscreenDocument, pingOffscreenAudio } from "./offscreen-document";
import { isTajdinSwMediaSessionMessage } from "../shared/messages/sw-bridge";
import { ensureLegacyStorageMigrated } from "../shared/storage/storage-migration";
import {
  handleMediaSessionAction,
  sessionNextStation,
  sessionPreviousStation,
  sessionToggleMute,
  sessionTogglePlayPause,
} from "./session-playback";

async function startBackground(): Promise<void> {
  try {
    await ensureLegacyStorageMigrated();
  } catch {
    // Popup/settings run the same migration on open if SW migration fails.
  }

  registerKeepAliveAlarmListener();

  chrome.commands.onCommand.addListener((command) => {
    if (command === "tajdin-open-popup") {
      void chrome.action.openPopup().catch(() => {
        /* e.g. no popup or gesture context */
      });
      return;
    }
    if (command === "tajdin-toggle-playback") {
      void sessionTogglePlayPause();
      return;
    }
    if (command === "tajdin-next-station") {
      void sessionNextStation();
      return;
    }
    if (command === "tajdin-previous-station") {
      void sessionPreviousStation();
      return;
    }
    if (command === "tajdin-toggle-mute") {
      void sessionToggleMute();
      return;
    }
  });

  chrome.runtime.onInstalled.addListener(() => {
    void ensureLegacyStorageMigrated();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isTajdinSwMediaSessionMessage(message)) {
      void handleMediaSessionAction(message.action);
      return false;
    }
    if (tryHandlePlayerMessage(message, sendResponse)) {
      return true;
    }
    if (message?.type === "tajdin/health-check") {
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "tajdin/sw/ensure-offscreen") {
      void ensureOffscreenDocument()
        .then(() => sendResponse({ ok: true as const }))
        .catch((e: unknown) =>
          sendResponse({ ok: false as const, error: e instanceof Error ? e.message : String(e) }),
        );
      return true;
    }
    if (message?.type === "tajdin/sw/ping-offscreen") {
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
