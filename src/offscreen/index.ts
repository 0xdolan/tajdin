import type {
  ZengOffscreenCommand,
  ZengOffscreenGetStateResponse,
  ZengOffscreenLoadResponse,
  ZengOffscreenPingResponse,
  ZengOffscreenPlayResponse,
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

function getState(): ZengOffscreenGetStateResponse {
  return {
    paused: player.paused,
    volumePercent: Math.round(player.volume * 100),
    currentSrc: player.currentSrc,
    readyState: player.readyState,
  };
}

function isCommand(msg: unknown): msg is ZengOffscreenCommand {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    typeof (msg as { type: unknown }).type === "string" &&
    String((msg as { type: string }).type).startsWith("zeng/offscreen/")
  );
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isCommand(message)) {
    return false;
  }

  switch (message.type) {
    case "zeng/offscreen/ping": {
      const res: ZengOffscreenPingResponse = { ok: true, paused: player.paused };
      sendResponse(res);
      return false;
    }
    case "zeng/offscreen/load": {
      try {
        player.src = message.url;
        const res: ZengOffscreenLoadResponse = { ok: true };
        sendResponse(res);
      } catch (e) {
        const res: ZengOffscreenLoadResponse = {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
        sendResponse(res);
      }
      return false;
    }
    case "zeng/offscreen/play": {
      void player.play().then(
        () => {
          const res: ZengOffscreenPlayResponse = { ok: true };
          sendResponse(res);
        },
        (e: unknown) => {
          const res: ZengOffscreenPlayResponse = {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          };
          sendResponse(res);
        },
      );
      return true;
    }
    case "zeng/offscreen/pause": {
      player.pause();
      sendResponse({ ok: true });
      return false;
    }
    case "zeng/offscreen/set-volume": {
      player.volume = clampVolumePercent(message.volumePercent) / 100;
      sendResponse({ ok: true });
      return false;
    }
    case "zeng/offscreen/get-state": {
      sendResponse(getState());
      return false;
    }
    default: {
      return false;
    }
  }
});
