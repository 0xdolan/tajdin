import type {
  TajdinOffscreenCommand,
  TajdinOffscreenGetStateResponse,
  TajdinOffscreenLoadResponse,
  TajdinOffscreenPingResponse,
  TajdinOffscreenPlayResponse,
} from "../shared/messages/offscreen";

const player = ((): HTMLAudioElement => {
  const el = document.querySelector("#player");
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error("Missing #player audio element");
  }
  return el;
})();

function clampVolumePercent(n: number): number {
  if (Number.isNaN(n)) return 100;
  return Math.min(100, Math.max(0, n));
}

function getState(): TajdinOffscreenGetStateResponse {
  return {
    paused: player.paused,
    volumePercent: Math.round(player.volume * 100),
    currentSrc: player.currentSrc,
    readyState: player.readyState,
  };
}

function isCommand(msg: unknown): msg is TajdinOffscreenCommand {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    typeof (msg as { type: unknown }).type === "string" &&
    String((msg as { type: string }).type).startsWith("tajdin/offscreen/")
  );
}

let mediaSessionBridgeInstalled = false;

function installMediaSessionBridge(): void {
  if (mediaSessionBridgeInstalled || !("mediaSession" in navigator)) return;
  mediaSessionBridgeInstalled = true;
  const send = (action: "play" | "pause" | "next" | "previous") => {
    try {
      void chrome.runtime.sendMessage({ type: "tajdin/sw/media-session-action", action });
    } catch {
      /* extension context invalid */
    }
  };
  try {
    navigator.mediaSession.setActionHandler("play", () => send("play"));
    navigator.mediaSession.setActionHandler("pause", () => send("pause"));
    navigator.mediaSession.setActionHandler("previoustrack", () => send("previous"));
    navigator.mediaSession.setActionHandler("nexttrack", () => send("next"));
  } catch {
    /* older Chromium */
  }
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isCommand(message)) {
    return false;
  }

  switch (message.type) {
    case "tajdin/offscreen/ping": {
      const res: TajdinOffscreenPingResponse = { ok: true, paused: player.paused };
      sendResponse(res);
      return false;
    }
    case "tajdin/offscreen/load": {
      try {
        player.src = message.url;
        const res: TajdinOffscreenLoadResponse = { ok: true };
        sendResponse(res);
      } catch (e) {
        const res: TajdinOffscreenLoadResponse = {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
        sendResponse(res);
      }
      return false;
    }
    case "tajdin/offscreen/play": {
      void player.play().then(
        () => {
          if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
          }
          const res: TajdinOffscreenPlayResponse = { ok: true };
          sendResponse(res);
        },
        (e: unknown) => {
          const res: TajdinOffscreenPlayResponse = {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          };
          sendResponse(res);
        },
      );
      return true;
    }
    case "tajdin/offscreen/pause": {
      player.pause();
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
      sendResponse({ ok: true });
      return false;
    }
    case "tajdin/offscreen/set-volume": {
      player.volume = clampVolumePercent(message.volumePercent) / 100;
      sendResponse({ ok: true });
      return false;
    }
    case "tajdin/offscreen/get-state": {
      sendResponse(getState());
      return false;
    }
    case "tajdin/offscreen/set-media-metadata": {
      installMediaSessionBridge();
      if ("mediaSession" in navigator && "MediaMetadata" in window) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: message.title,
            artist: message.artist ?? "Tajdîn",
          });
          navigator.mediaSession.playbackState = player.paused ? "paused" : "playing";
        } catch {
          /* ignore */
        }
      }
      sendResponse({ ok: true });
      return false;
    }
    case "tajdin/offscreen/clear-media-metadata": {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
      sendResponse({ ok: true });
      return false;
    }
    default: {
      return false;
    }
  }
});
