import { useEffect, useState } from "react";
import { AboutSection } from "../../settings/components/AboutSection";
import { listScrollbarClass } from "../../shared/utils/list-scrollbar";
import { readAddStationDraft } from "../addStationDraftSession";
import { useSurface } from "../SurfaceContext";
import { useSearch } from "../hooks/useSearch";
import { useUiStore, type ActiveTab } from "../store/uiStore";
import { AddStationModal } from "./AddStationModal";
import { FavouritesStationList } from "./FavouritesStationList";
import { PlaylistsPage } from "./PlaylistsPage";
import { BrowseCustomStationsToggle } from "./BrowseCustomStationsToggle";
import { StationLanguageFilter } from "./StationLanguageFilter";
import { StationList } from "./StationList";
import { StationSearchBar } from "./StationSearchBar";

const TITLES: Record<ActiveTab, string> = {
  browse: "Browse",
  favourites: "Favourites",
  playlists: "Playlists",
  about: "About",
};

export function TabPanel() {
  const surface = useSurface();
  const activeTab = useUiStore((s) => s.activeTab);
  const search = useSearch();
  const browseLanguage = useUiStore((s) => s.browseLanguageApiValue);
  const setBrowseLanguage = useUiStore((s) => s.setBrowseLanguageApiValue);
  const browseCustomOnly = useUiStore((s) => s.browseCustomStationsOnly);
  const setBrowseCustomOnly = useUiStore((s) => s.setBrowseCustomStationsOnly);
  const title = TITLES[activeTab];
  const [addStationOpen, setAddStationOpen] = useState(false);
  const [customStationsTick, setCustomStationsTick] = useState(0);

  useEffect(() => {
    void readAddStationDraft("popup").then((d) => {
      if (d.modalOpen) setAddStationOpen(true);
    });
  }, []);

  const panelClass =
    surface === "light"
      ? "box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-100 px-3 py-3"
      : "box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 py-3";
  const titleClass =
    surface === "light"
      ? "mb-2 shrink-0 text-sm font-semibold text-neutral-800"
      : "mb-2 shrink-0 text-sm font-semibold text-neutral-200";
  const panelHeadingClass =
    activeTab === "about" ? `${titleClass} sr-only` : titleClass;
  const addBtn =
    surface === "light"
      ? "rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-800 shadow-sm hover:bg-neutral-50"
      : "rounded-md border border-neutral-600 bg-neutral-900 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800";

  return (
    <div
      role="tabpanel"
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
      className={panelClass}
    >
      <h2 className={panelHeadingClass}>{title}</h2>
      {activeTab === "browse" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
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
              <button type="button" className={addBtn} onClick={() => setAddStationOpen(true)}>
                Add station
              </button>
              <BrowseCustomStationsToggle pressed={browseCustomOnly} onPressedChange={setBrowseCustomOnly} />
              <StationLanguageFilter
                value={browseLanguage}
                onChange={setBrowseLanguage}
                disabled={browseCustomOnly}
              />
            </div>
          </div>
          <AddStationModal
            draftScope="popup"
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
              customStationsOnly={browseCustomOnly}
              customStationsTick={customStationsTick}
            />
          </div>
        </div>
      ) : activeTab === "playlists" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <PlaylistsPage />
        </div>
      ) : activeTab === "about" ? (
        <div
          className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-1 ${listScrollbarClass(surface)}`}
        >
          <AboutSection surface={surface} />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-label="Favourite stations">
          <FavouritesStationList />
        </div>
      )}
    </div>
  );
}
