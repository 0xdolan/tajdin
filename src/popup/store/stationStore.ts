import { create } from "zustand";
import type { Station } from "../../shared/types/station";

export const useStationStore = create<{
  searchResults: Station[];
  isSearchLoading: boolean;
  favouriteIds: string[];
  /** Radio Browser `language` param; empty string = no filter. */
  browseLanguageApiValue: string;
  setSearchResults: (stations: Station[]) => void;
  replaceSearchResults: (stations: Station[]) => void;
  appendSearchResults: (stations: Station[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setBrowseLanguageApiValue: (language: string) => void;
  setFavouriteIds: (ids: string[]) => void;
  toggleFavourite: (stationuuid: string) => void;
  clearSearch: () => void;
}>((set, get) => ({
  searchResults: [],
  isSearchLoading: false,
  favouriteIds: [],
  browseLanguageApiValue: "",
  setSearchResults: (searchResults) => set({ searchResults }),
  replaceSearchResults: (searchResults) => set({ searchResults }),
  appendSearchResults: (more) =>
    set((s) => {
      const seen = new Set(s.searchResults.map((x) => x.stationuuid));
      const merged = [...s.searchResults];
      for (const st of more) {
        if (!seen.has(st.stationuuid)) {
          seen.add(st.stationuuid);
          merged.push(st);
        }
      }
      return { searchResults: merged };
    }),
  setSearchLoading: (isSearchLoading) => set({ isSearchLoading }),
  setBrowseLanguageApiValue: (browseLanguageApiValue) => set({ browseLanguageApiValue }),
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
