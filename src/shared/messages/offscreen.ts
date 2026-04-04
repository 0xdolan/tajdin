/**
 * Commands sent from the service worker to the offscreen audio document.
 * (Popup/ other contexts should ask the SW; the SW forwards to offscreen.)
 */
export type ZengOffscreenCommand =
  | { type: "zeng/offscreen/ping" }
  | { type: "zeng/offscreen/load"; url: string }
  | { type: "zeng/offscreen/play" }
  | { type: "zeng/offscreen/pause" }
  /** 0–100, maps to HTMLMediaElement.volume (0–1). */
  | { type: "zeng/offscreen/set-volume"; volumePercent: number }
  | { type: "zeng/offscreen/get-state" };

export type ZengOffscreenPingResponse = { ok: true; paused: boolean };

export type ZengOffscreenLoadResponse = { ok: true } | { ok: false; error: string };

export type ZengOffscreenPlayResponse =
  | { ok: true }
  | { ok: false; error: string };

export type ZengOffscreenGetStateResponse = {
  paused: boolean;
  volumePercent: number;
  currentSrc: string;
  readyState: number;
};
