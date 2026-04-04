import { create } from "zustand";
import type { SessionUi } from "../../shared/storage/schemas";

type ActiveTab = NonNullable<SessionUi["activeTab"]>;

export const useUiStore = create<{
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  applySessionUi: (patch: SessionUi) => void;
}>((set) => ({
  activeTab: "browse",
  setActiveTab: (activeTab) => set({ activeTab }),
  applySessionUi: (patch) =>
    set((s) => {
      const activeTab = patch.activeTab ?? s.activeTab;
      if (activeTab === s.activeTab) {
        return s;
      }
      return { activeTab };
    }),
}));
