import { create } from "zustand";
import type { SessionPlayer } from "../../shared/storage/schemas";
import type { Station } from "../../shared/types/station";

export type PlaylistPlaybackContext = {
  playlistId: string;
  stationIndex: number;
};

export type PlayerStoreState = {
  stationuuid: string | null;
  isPlaying: boolean;
  volumePercent: number;
  /** UI + engine: when true, offscreen volume is forced to 0 while slider keeps {@link volumePercent}. */
  muted: boolean;
  streamUrl: string | null;
  station: Station | null;
  /** Ordered playlist playback: advance to next station after a failed stream load. */
  playlistContext: PlaylistPlaybackContext | null;
};

const defaults: PlayerStoreState = {
  stationuuid: null,
  isPlaying: false,
  volumePercent: 100,
  muted: false,
  streamUrl: null,
  station: null,
  playlistContext: null,
};

export type PlayerStoreActions = {
  resetPlayer: () => void;
  applySessionPlayer: (patch: SessionPlayer) => void;
  setStation: (station: Station | null) => void;
  beginPlaylistPlayback: (station: Station, playlistId: string, stationIndex: number) => void;
  setPlaylistContext: (ctx: PlaylistPlaybackContext | null) => void;
  setStreamUrl: (url: string | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolumePercent: (volumePercent: number) => void;
  setMuted: (muted: boolean) => void;
};

export const usePlayerStore = create<PlayerStoreState & PlayerStoreActions>((set) => ({
  ...defaults,
  resetPlayer: () => set(defaults),
  applySessionPlayer: (patch) =>
    set((s) => {
      const stationuuid =
        patch.stationuuid !== undefined ? (patch.stationuuid ?? null) : s.stationuuid;
      const isPlaying = patch.isPlaying !== undefined ? patch.isPlaying : s.isPlaying;
      const volumePercent =
        patch.volumePercent !== undefined ? patch.volumePercent : s.volumePercent;

      let playlistContext = s.playlistContext;
      const pid = patch.playlistId;
      const pix = patch.playlistStationIndex;
      if (pid !== undefined || pix !== undefined) {
        if (typeof pid === "string" && typeof pix === "number") {
          playlistContext = { playlistId: pid, stationIndex: pix };
        } else {
          playlistContext = null;
        }
      }

      if (
        stationuuid === s.stationuuid &&
        isPlaying === s.isPlaying &&
        volumePercent === s.volumePercent &&
        playlistContext === s.playlistContext
      ) {
        return s;
      }
      return { ...s, stationuuid, isPlaying, volumePercent, playlistContext };
    }),
  setStation: (station) =>
    set({
      station,
      stationuuid: station?.stationuuid ?? null,
      streamUrl: station ? (station.url_resolved || station.url || null) : null,
      playlistContext: null,
    }),
  beginPlaylistPlayback: (station, playlistId, stationIndex) =>
    set({
      station,
      stationuuid: station.stationuuid,
      streamUrl: station.url_resolved || station.url || null,
      playlistContext: { playlistId, stationIndex },
    }),
  setPlaylistContext: (playlistContext) => set({ playlistContext }),
  setStreamUrl: (streamUrl) => set({ streamUrl }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolumePercent: (volumePercent) =>
    set({
      volumePercent: Math.min(100, Math.max(0, Math.round(volumePercent))),
    }),
  setMuted: (muted) => set({ muted }),
}));
