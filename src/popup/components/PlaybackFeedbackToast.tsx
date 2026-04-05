import { useSurface } from "../SurfaceContext";
import { useFeedbackStore } from "../store/feedbackStore";

/**
 * Short playback errors / hints (aria-live). Fixed above the player dock.
 */
export function PlaybackFeedbackToast() {
  const surface = useSurface();
  const message = useFeedbackStore((s) => s.playbackMessage);
  const clear = useFeedbackStore((s) => s.clearPlaybackMessage);
  const bar =
    surface === "light"
      ? "border-amber-200/90 bg-amber-50 text-amber-950"
      : "border-amber-500/35 bg-amber-950/40 text-amber-50";

  return (
    <div
      className="min-h-0 shrink-0 border-b border-transparent px-3 py-1 text-center text-xs leading-snug empty:hidden"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message ? (
        <div className={`rounded-md border px-2 py-1.5 ${bar}`}>
          <span className="inline">{message}</span>
          <button
            type="button"
            className={`ms-2 inline rounded px-1.5 py-0.5 text-[0.7rem] font-medium underline-offset-2 hover:underline ${
              surface === "light" ? "text-amber-900" : "text-amber-200"
            }`}
            onClick={() => clear()}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
