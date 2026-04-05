import { sanitizeDisplayText } from "../shared/utils/sanitize";
import { sendPlayerCommand } from "./playerBridge";
import { usePlayerStore } from "./store/playerStore";

/** Push OS media session / lock-screen metadata for the current station (offscreen). */
export async function pushMediaMetadataForCurrentStation(): Promise<void> {
  const st = usePlayerStore.getState().station;
  if (!st) return;
  const title = sanitizeDisplayText(st.name, { maxLength: 200 });
  const artistParts = [st.country ?? st.countrycode, st.language ?? st.languagecodes].filter(Boolean);
  const artist =
    artistParts.length > 0
      ? sanitizeDisplayText(String(artistParts.join(" · ")), { maxLength: 120 })
      : "Tajdîn";
  const r = await sendPlayerCommand({
    type: "tajdin/player/set-media-metadata",
    title,
    artist,
  });
  if (!r.ok) {
    /* non-fatal */
  }
}

/** Clear lock-screen metadata (e.g. on pause). */
export async function clearMediaMetadataRemote(): Promise<void> {
  await sendPlayerCommand({ type: "tajdin/player/clear-media-metadata" });
}
