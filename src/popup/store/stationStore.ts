import { create } from "zustand";
import type { Station } from "../../shared/types/station";

export const useStationStore = create<{
  searchResults: Station[];
  isSearchLoading: boolean;
  favouriteIds: string[];
  setSearchResults: (stations: Station[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setFavouriteIds: (ids: string[]) => void;
  toggleFavourite: (stationuuid: string) => void;
  clearSearch: () => void;
}>((set, get) => ({
  searchResults: [],
  isSearchLoading: false,
  favouriteIds: [],
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchLoading: (isSearchLoading) => set({ isSearchLoading }),
  setFavouriteIds: (favouriteIds) => set({ favouriteIds }),
  toggleFavourite: (stationuuid) => {
    const { favouriteIds } = get();
    const has = favouriteIds.includes(stationuuid);
    set({
      favouriteIds: has
        ? favouriteIds.filter((id) => id !== stationuuid)
        : [...favouriteIds, stationuuid],
    });
  },
  clearSearch: () => set({ searchResults: [], isSearchLoading: false }),
}));
