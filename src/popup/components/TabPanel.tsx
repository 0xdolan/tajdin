import type { SessionUi } from "../../shared/storage/schemas";
import { useUiStore } from "../store/uiStore";
import { StationList } from "./StationList";

type ActiveTab = NonNullable<SessionUi["activeTab"]>;

const COPY: Record<ActiveTab, { title: string; body: string }> = {
  browse: {
    title: "Browse",
    body: "Station discovery and search will appear here.",
  },
  favourites: {
    title: "Favourites",
    body: "Saved stations will appear here.",
  },
  playlists: {
    title: "Playlists",
    body: "Your playlists will appear here.",
  },
  groups: {
    title: "Groups",
    body: "Station groups will appear here.",
  },
};

export function TabPanel() {
  const activeTab = useUiStore((s) => s.activeTab);
  const { title, body } = COPY[activeTab];

  return (
    <div
      role="tabpanel"
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
      className="box-border flex min-h-0 flex-1 flex-col px-3 py-3"
    >
      <h2 className="mb-2 shrink-0 text-sm font-semibold text-neutral-200">{title}</h2>
      {activeTab === "browse" ? (
        <div className="min-h-0 flex-1" aria-label="Stations">
          <StationList />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-neutral-500">{body}</p>
      )}
    </div>
  );
}
