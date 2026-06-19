import { sendPlayerCommand } from "./playerBridge";
import { usePlayerStore } from "./store/playerStore";

/** Align popup `isPlaying` with the offscreen `<audio>` element (source of truth). */
export async function syncPlayerPlayingFromEngine(): Promise<boolean | null> {
  const r = await sendPlayerCommand({ type: "tajdin/player/get-state" });
  if (!r.ok || r.result.type !== "tajdin/player/get-state") return null;
  const enginePlaying = !r.result.data.paused;
  usePlayerStore.getState().setPlaying(enginePlaying);
  return enginePlaying;
}
