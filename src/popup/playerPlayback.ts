import { defaultRadioBrowserClient } from "../shared/api/radio-browser.api";
import { sendPlayerCommand } from "./playerBridge";
import { pushMediaMetadataForCurrentStation } from "./mediaMetadataSync";
import { useFeedbackStore } from "./store/feedbackStore";
import { usePlayerStore } from "./store/playerStore";

export type LoadPlayResult = "ok" | "load-failed" | "play-failed";

export async function loadUrlAndPlay(url: string): Promise<LoadPlayResult> {
  const loadR = await sendPlayerCommand({ type: "tajdin/player/load", url });
  if (!loadR.ok || loadR.result.type !== "tajdin/player/load" || !loadR.result.data.ok) {
    return "load-failed";
  }
  const { muted, volumePercent } = usePlayerStore.getState();
  const effectiveVol = muted ? 0 : volumePercent;
  await sendPlayerCommand({ type: "tajdin/player/set-volume", volumePercent: effectiveVol });
  const playR = await sendPlayerCommand({ type: "tajdin/player/play" });
  if (!playR.ok || playR.result.type !== "tajdin/player/play" || !playR.result.data.ok) {
    return "play-failed";
  }
  return "ok";
}

function showFinalPlaybackFailure(
  reason: "load-failed" | "play-failed" | "no-url",
  hadPlaylistContext: boolean,
  skippedStations: boolean,
): void {
  const show = useFeedbackStore.getState().showPlaybackMessage;
  if (reason === "no-url") {
    show("No playable stream for this station. Choose another station or fix the URL.");
    return;
  }
  if (reason === "play-failed") {
    show("Playback failed to start. Try another station or check your connection.");
    return;
  }
  if (hadPlaylistContext) {
    show(
      skippedStations
        ? "Could not load a working stream from this playlist after skipping ahead. Try editing the list or play another station."
        : "Could not load this stream. Tajdîn will try the next station in your playlist when one is set.",
    );
    return;
  }
  show(
    "Could not load this stream. Check your connection or pick another station. In a playlist, failed stations are skipped automatically when possible.",
  );
}

/**
 * Load current {@link usePlayerStore} stream URL and play. On **load** failure, if a playlist
 * context is set, advance to the next station in that playlist and retry (bounded).
 */
export async function startPlaybackWithPlaylistSkip(): Promise<boolean> {
  const initial = usePlayerStore.getState();
  let url = initial.streamUrl || initial.station?.url_resolved || initial.station?.url || null;
  if (!url) {
    showFinalPlaybackFailure("no-url", Boolean(initial.playlistContext), false);
    return false;
  }

  let skippedStations = false;
  const hadPlaylistAtStart = Boolean(initial.playlistContext);

  for (let hop = 0; hop < 100; hop++) {
    const r = await loadUrlAndPlay(url);
    if (r === "ok") {
      usePlayerStore.getState().setPlaying(true);
      void pushMediaMetadataForCurrentStation();
      return true;
    }
    if (r !== "load-failed") {
      showFinalPlaybackFailure("play-failed", hadPlaylistAtStart, skippedStations);
      return false;
    }
    const ctx = usePlayerStore.getState().playlistContext;
    if (!ctx) {
      showFinalPlaybackFailure("load-failed", false, skippedStations);
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
      showFinalPlaybackFailure("load-failed", true, skippedStations);
      return false;
    }
    skippedStations = true;
    usePlayerStore.getState().beginPlaylistPlayback(next.station, ctx.playlistId, next.index);
    url = next.station.url_resolved || next.station.url || null;
    if (!url) {
      showFinalPlaybackFailure("load-failed", true, skippedStations);
      return false;
    }
  }
  showFinalPlaybackFailure("load-failed", hadPlaylistAtStart, skippedStations);
  return false;
}
