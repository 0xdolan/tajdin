import { create } from "zustand";
import type { SessionUi } from "../../shared/storage/schemas";
import { TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE } from "../../shared/utils/language-mapper";

export type ActiveTab = NonNullable<SessionUi["activeTab"]>;
export type BrowseSearchMode = "exact" | "regex";

export const useUiStore = create<{
  activeTab: ActiveTab;
  browseRawQuery: string;
  browseSearchMode: BrowseSearchMode;
  browseLanguageApiValue: string;
  browseCustomStationsOnly: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  setBrowseRawQuery: (q: string) => void;
  setBrowseSearchMode: (m: BrowseSearchMode) => void;
  setBrowseLanguageApiValue: (v: string) => void;
  setBrowseCustomStationsOnly: (v: boolean) => void;
  applySessionUi: (patch: SessionUi) => void;
}>((set) => ({
  activeTab: "browse",
  browseRawQuery: "",
  browseSearchMode: "exact",
  browseLanguageApiValue: TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE,
  browseCustomStationsOnly: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setBrowseRawQuery: (browseRawQuery) => set({ browseRawQuery }),
  setBrowseSearchMode: (browseSearchMode) => set({ browseSearchMode }),
  setBrowseLanguageApiValue: (browseLanguageApiValue) => set({ browseLanguageApiValue }),
  setBrowseCustomStationsOnly: (browseCustomStationsOnly) => set({ browseCustomStationsOnly }),
  applySessionUi: (patch) =>
    set((s) => {
      const next = {
        activeTab: (patch.activeTab ?? s.activeTab) as ActiveTab,
        browseRawQuery: patch.browseQuery !== undefined ? patch.browseQuery : s.browseRawQuery,
        browseSearchMode: (patch.browseSearchMode ?? s.browseSearchMode) as BrowseSearchMode,
        browseLanguageApiValue:
          patch.browseLanguageApiValue !== undefined ? patch.browseLanguageApiValue : s.browseLanguageApiValue,
        browseCustomStationsOnly:
          patch.browseCustomStationsOnly !== undefined ? patch.browseCustomStationsOnly : s.browseCustomStationsOnly,
      };
      if (
        next.activeTab === s.activeTab &&
        next.browseRawQuery === s.browseRawQuery &&
        next.browseSearchMode === s.browseSearchMode &&
        next.browseLanguageApiValue === s.browseLanguageApiValue &&
        next.browseCustomStationsOnly === s.browseCustomStationsOnly
      ) {
        return s;
      }
      return next;
    }),
}));
