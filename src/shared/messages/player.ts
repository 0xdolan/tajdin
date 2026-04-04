import type {
  ZengOffscreenGetStateResponse,
  ZengOffscreenLoadResponse,
  ZengOffscreenPlayResponse,
} from "./offscreen";

/**
 * Playback control from popup/settings → service worker → offscreen `<audio>`.
 */
export type ZengPlayerCommand =
  | { type: "zeng/player/load"; url: string }
  | { type: "zeng/player/play" }
  | { type: "zeng/player/pause" }
  | { type: "zeng/player/set-volume"; volumePercent: number }
  | { type: "zeng/player/get-state" };

export type ZengPlayerCommandResult =
  | { type: "zeng/player/load"; data: ZengOffscreenLoadResponse }
  | { type: "zeng/player/play"; data: ZengOffscreenPlayResponse }
  | { type: "zeng/player/pause"; data: { ok: true } }
  | { type: "zeng/player/set-volume"; data: { ok: true } }
  | { type: "zeng/player/get-state"; data: ZengOffscreenGetStateResponse };

export function isPlayerCommand(msg: unknown): msg is ZengPlayerCommand {
  if (typeof msg !== "object" || msg === null || !("type" in msg)) {
    return false;
  }
  const t = (msg as { type: string }).type;
  switch (t) {
    case "zeng/player/load":
      return (
        "url" in msg &&
        typeof (msg as { url: unknown }).url === "string" &&
        (msg as { url: string }).url.length > 0
      );
    case "zeng/player/play":
    case "zeng/player/pause":
    case "zeng/player/get-state":
      return true;
    case "zeng/player/set-volume":
      return (
        "volumePercent" in msg && typeof (msg as { volumePercent: unknown }).volumePercent === "number"
      );
    default:
      return false;
  }
}
