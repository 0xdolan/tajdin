import { create } from "zustand";
import type { SessionUi } from "../../shared/storage/schemas";

export type ActiveTab = NonNullable<SessionUi["activeTab"]>;
export type BrowseSearchMode = "fuzzy" | "regex";

export const useUiStore = create<{
  activeTab: ActiveTab;
  browseRawQuery: string;
  browseSearchMode: BrowseSearchMode;
  browseLanguageApiValue: string;
  setActiveTab: (tab: ActiveTab) => void;
  setBrowseRawQuery: (q: string) => void;
  setBrowseSearchMode: (m: BrowseSearchMode) => void;
  setBrowseLanguageApiValue: (v: string) => void;
  applySessionUi: (patch: SessionUi) => void;
}>((set) => ({
  activeTab: "browse",
  browseRawQuery: "",
  browseSearchMode: "fuzzy",
  browseLanguageApiValue: "",
  setActiveTab: (activeTab) => set({ activeTab }),
  setBrowseRawQuery: (browseRawQuery) => set({ browseRawQuery }),
  setBrowseSearchMode: (browseSearchMode) => set({ browseSearchMode }),
  setBrowseLanguageApiValue: (browseLanguageApiValue) => set({ browseLanguageApiValue }),
  applySessionUi: (patch) =>
    set((s) => {
      const next = {
        activeTab: (patch.activeTab ?? s.activeTab) as ActiveTab,
        browseRawQuery: patch.browseQuery !== undefined ? patch.browseQuery : s.browseRawQuery,
        browseSearchMode: (patch.browseSearchMode ?? s.browseSearchMode) as BrowseSearchMode,
        browseLanguageApiValue:
          patch.browseLanguageApiValue !== undefined ? patch.browseLanguageApiValue : s.browseLanguageApiValue,
      };
      if (
        next.activeTab === s.activeTab &&
        next.browseRawQuery === s.browseRawQuery &&
        next.browseSearchMode === s.browseSearchMode &&
        next.browseLanguageApiValue === s.browseLanguageApiValue
      ) {
        return s;
      }
      return next;
    }),
}));
