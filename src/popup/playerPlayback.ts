import { defaultRadioBrowserClient } from "../shared/api/radio-browser.api";
import { sendPlayerCommand } from "./playerBridge";
import { usePlayerStore } from "./store/playerStore";

export type LoadPlayResult = "ok" | "load-failed" | "play-failed";

export async function loadUrlAndPlay(url: string): Promise<LoadPlayResult> {
  const loadR = await sendPlayerCommand({ type: "zeng/player/load", url });
  if (!loadR.ok || loadR.result.type !== "zeng/player/load" || !loadR.result.data.ok) {
    return "load-failed";
  }
  const playR = await sendPlayerCommand({ type: "zeng/player/play" });
  if (!playR.ok || playR.result.type !== "zeng/player/play" || !playR.result.data.ok) {
    return "play-failed";
  }
  return "ok";
}

/**
 * Load current {@link usePlayerStore} stream URL and play. On **load** failure, if a playlist
 * context is set, advance to the next station in that playlist and retry (bounded).
 */
export async function startPlaybackWithPlaylistSkip(): Promise<boolean> {
  const initial = usePlayerStore.getState();
  let url = initial.streamUrl || initial.station?.url_resolved || initial.station?.url || null;
  if (!url) return false;

  for (let hop = 0; hop < 100; hop++) {
    const r = await loadUrlAndPlay(url);
    if (r === "ok") {
      usePlayerStore.getState().setPlaying(true);
      return true;
    }
    if (r !== "load-failed") {
      return false;
    }
    const ctx = usePlayerStore.getState().playlistContext;
    if (!ctx) {
      return false;
    }
    const { findNextPlayableInPlaylist } = await import("./playlistAdvance");
    const next = await findNextPlayableInPlaylist(
      defaultRadioBrowserClient,
      ctx.playlistId,
      ctx.stationIndex,
    );
    if (!next) {
      usePlayerStore.getState().setPlaylistContext(null);
      return false;
    }
    usePlayerStore.getState().beginPlaylistPlayback(next.station, ctx.playlistId, next.index);
    url = next.station.url_resolved || next.station.url || null;
    if (!url) {
      return false;
    }
  }
  return false;
}
