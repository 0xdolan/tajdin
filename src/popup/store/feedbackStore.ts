import { create } from "zustand";

type FeedbackState = {
  playbackMessage: string | null;
  /** Auto-cleared after timeout. */
  showPlaybackMessage: (message: string, durationMs?: number) => void;
  clearPlaybackMessage: () => void;
};

let playbackTimer: ReturnType<typeof setTimeout> | undefined;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  playbackMessage: null,
  showPlaybackMessage: (message, durationMs = 6500) => {
    if (playbackTimer) clearTimeout(playbackTimer);
    set({ playbackMessage: message });
    playbackTimer = setTimeout(() => {
      playbackTimer = undefined;
      set({ playbackMessage: null });
    }, durationMs);
  },
  clearPlaybackMessage: () => {
    if (playbackTimer) clearTimeout(playbackTimer);
    playbackTimer = undefined;
    set({ playbackMessage: null });
  },
}));
