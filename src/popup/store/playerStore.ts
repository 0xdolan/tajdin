import { create } from "zustand";
import type { SessionPlayer } from "../../shared/storage/schemas";
import type { Station } from "../../shared/types/station";

export type PlayerStoreState = {
  stationuuid: string | null;
  isPlaying: boolean;
  volumePercent: number;
  streamUrl: string | null;
  station: Station | null;
};

const defaults: PlayerStoreState = {
  stationuuid: null,
  isPlaying: false,
  volumePercent: 100,
  streamUrl: null,
  station: null,
};

export type PlayerStoreActions = {
  resetPlayer: () => void;
  applySessionPlayer: (patch: SessionPlayer) => void;
  setStation: (station: Station | null) => void;
  setStreamUrl: (url: string | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolumePercent: (volumePercent: number) => void;
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
      if (
        stationuuid === s.stationuuid &&
        isPlaying === s.isPlaying &&
        volumePercent === s.volumePercent
      ) {
        return s;
      }
      return { ...s, stationuuid, isPlaying, volumePercent };
    }),
  setStation: (station) =>
    set({
      station,
      stationuuid: station?.stationuuid ?? null,
      streamUrl: station ? (station.url_resolved || station.url || null) : null,
    }),
  setStreamUrl: (streamUrl) => set({ streamUrl }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolumePercent: (volumePercent) =>
    set({
      volumePercent: Math.min(100, Math.max(0, Math.round(volumePercent))),
    }),
}));
