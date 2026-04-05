/** Offscreen → service worker: user used OS media keys / lock screen. */
export type TajdinSwMediaSessionMessage = {
  type: "tajdin/sw/media-session-action";
  action: "play" | "pause" | "next" | "previous";
};

function isMediaSessionAction(action: unknown): action is TajdinSwMediaSessionMessage["action"] {
  return action === "play" || action === "pause" || action === "next" || action === "previous";
}

export function isTajdinSwMediaSessionMessage(msg: unknown): msg is TajdinSwMediaSessionMessage {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as { type?: unknown; action?: unknown };
  if (m.type !== "tajdin/sw/media-session-action") return false;
  return isMediaSessionAction(m.action);
}
