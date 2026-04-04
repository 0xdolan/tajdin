import type { SessionUi } from "../../shared/storage/schemas";
import { useSearch } from "../hooks/useSearch";
import { useStationStore } from "../store/stationStore";
import { useUiStore } from "../store/uiStore";
import { PlaylistsPage } from "./PlaylistsPage";
import { StationLanguageFilter } from "./StationLanguageFilter";
import { StationList } from "./StationList";
import { StationSearchBar } from "./StationSearchBar";

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
  const search = useSearch();
  const browseLanguage = useStationStore((s) => s.browseLanguageApiValue);
  const setBrowseLanguage = useStationStore((s) => s.setBrowseLanguageApiValue);
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
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
            <div className="min-w-0 flex-1">
              <StationSearchBar
                rawQuery={search.rawQuery}
                setRawQuery={search.setRawQuery}
                mode={search.mode}
                setMode={search.setMode}
                regexInvalid={search.regexInvalid}
              />
            </div>
            <StationLanguageFilter value={browseLanguage} onChange={setBrowseLanguage} />
          </div>
          <div className="min-h-0 flex-1" aria-label="Stations">
            <StationList
              searchQuery={search.debouncedQuery}
              searchMode={search.mode}
              regexInvalid={search.regexInvalid}
              languageFilter={browseLanguage}
            />
          </div>
        </div>
      ) : activeTab === "playlists" ? (
        <PlaylistsPage />
      ) : (
        <p className="text-sm leading-relaxed text-neutral-500">{body}</p>
      )}
    </div>
  );
}
