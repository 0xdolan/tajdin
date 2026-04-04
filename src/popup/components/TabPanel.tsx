import { useState } from "react";
import type { SessionUi } from "../../shared/storage/schemas";
import { useSearch } from "../hooks/useSearch";
import { useStationStore } from "../store/stationStore";
import { useUiStore } from "../store/uiStore";
import { AddStationModal } from "./AddStationModal";
import { GroupsPage } from "./GroupsPage";
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
  const [addStationOpen, setAddStationOpen] = useState(false);
  const [customStationsTick, setCustomStationsTick] = useState(0);

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
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-neutral-600 bg-neutral-900 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
                onClick={() => setAddStationOpen(true)}
              >
                Add station
              </button>
              <StationLanguageFilter value={browseLanguage} onChange={setBrowseLanguage} />
            </div>
          </div>
          <AddStationModal
            open={addStationOpen}
            onOpenChange={setAddStationOpen}
            onAdded={() => setCustomStationsTick((n) => n + 1)}
          />
          <div className="min-h-0 flex-1" aria-label="Stations">
            <StationList
              searchQuery={search.debouncedQuery}
              searchMode={search.mode}
              regexInvalid={search.regexInvalid}
              languageFilter={browseLanguage}
              customStationsTick={customStationsTick}
            />
          </div>
        </div>
      ) : activeTab === "playlists" ? (
        <PlaylistsPage />
      ) : activeTab === "groups" ? (
        <GroupsPage />
      ) : (
        <p className="text-sm leading-relaxed text-neutral-500">{body}</p>
      )}
    </div>
  );
}
