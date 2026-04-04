/**
 * Commands sent from the service worker to the offscreen audio document.
 * (Popup/ other contexts should ask the SW; the SW forwards to offscreen.)
 */
export type TajdinOffscreenCommand =
  | { type: "tajdin/offscreen/ping" }
  | { type: "tajdin/offscreen/load"; url: string }
  | { type: "tajdin/offscreen/play" }
  | { type: "tajdin/offscreen/pause" }
  /** 0–100, maps to HTMLMediaElement.volume (0–1). */
  | { type: "tajdin/offscreen/set-volume"; volumePercent: number }
  | { type: "tajdin/offscreen/get-state" };

export type TajdinOffscreenPingResponse = { ok: true; paused: boolean };

export type TajdinOffscreenLoadResponse = { ok: true } | { ok: false; error: string };

export type TajdinOffscreenPlayResponse =
  | { ok: true }
  | { ok: false; error: string };

export type TajdinOffscreenGetStateResponse = {
  paused: boolean;
  volumePercent: number;
  currentSrc: string;
  readyState: number;
};
