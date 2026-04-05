import type {
  TajdinOffscreenGetStateResponse,
  TajdinOffscreenLoadResponse,
  TajdinOffscreenPlayResponse,
} from "./offscreen";

/**
 * Playback control from popup/settings → service worker → offscreen `<audio>`.
 */
export type TajdinPlayerCommand =
  | { type: "tajdin/player/load"; url: string }
  | { type: "tajdin/player/play" }
  | { type: "tajdin/player/pause" }
  | { type: "tajdin/player/set-volume"; volumePercent: number }
  | { type: "tajdin/player/get-state" }
  | { type: "tajdin/player/set-media-metadata"; title: string; artist?: string }
  | { type: "tajdin/player/clear-media-metadata" };

export type TajdinPlayerCommandResult =
  | { type: "tajdin/player/load"; data: TajdinOffscreenLoadResponse }
  | { type: "tajdin/player/play"; data: TajdinOffscreenPlayResponse }
  | { type: "tajdin/player/pause"; data: { ok: true } }
  | { type: "tajdin/player/set-volume"; data: { ok: true } }
  | { type: "tajdin/player/get-state"; data: TajdinOffscreenGetStateResponse }
  | { type: "tajdin/player/set-media-metadata"; data: { ok: true } }
  | { type: "tajdin/player/clear-media-metadata"; data: { ok: true } };

export function isPlayerCommand(msg: unknown): msg is TajdinPlayerCommand {
  if (typeof msg !== "object" || msg === null || !("type" in msg)) {
    return false;
  }
  const t = (msg as { type: string }).type;
  switch (t) {
    case "tajdin/player/load":
      return (
        "url" in msg &&
        typeof (msg as { url: unknown }).url === "string" &&
        (msg as { url: string }).url.length > 0
      );
    case "tajdin/player/play":
    case "tajdin/player/pause":
    case "tajdin/player/get-state":
      return true;
    case "tajdin/player/set-volume":
      return (
        "volumePercent" in msg && typeof (msg as { volumePercent: unknown }).volumePercent === "number"
      );
    case "tajdin/player/set-media-metadata":
      return "title" in msg && typeof (msg as { title: unknown }).title === "string";
    case "tajdin/player/clear-media-metadata":
      return true;
    default:
      return false;
  }
}
