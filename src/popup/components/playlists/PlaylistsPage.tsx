import { useCallback, useEffect, useState } from "react";
import { defaultRadioBrowserClient, type RadioBrowserClient } from "../../../shared/api/radio-browser.api";
import type { Playlist } from "../../../shared/types/playlist";
import { listScrollbarClass } from "../../../shared/utils/list-scrollbar";
import { sanitizeDisplayText } from "../../../shared/utils/sanitize";
import { useLocalSearch } from "../../hooks/useSearch";
import { loadPlaylistsForLibrary } from "../../stationLibraryApi";
import { useSurface } from "../../SurfaceContext";
import { useUiStore } from "../../store/uiStore";
import { StationLanguageFilter } from "../StationLanguageFilter";
import { StationList } from "../StationList";
import { StationSearchBar } from "../StationSearchBar";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";
import { PlaylistCreateForm } from "./PlaylistCreateForm";
import { PlaylistEditorCard } from "./PlaylistEditorCard";
import { PlaylistPickerList } from "./PlaylistPickerList";

export function PlaylistsPage({ client = defaultRadioBrowserClient }: { client?: RadioBrowserClient }) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);
  const rootScroll = listScrollbarClass(surface);
  const listsSearch = useLocalSearch();
  const browseLanguage = useUiStore((s) => s.browseLanguageApiValue);
  const setBrowseLanguage = useUiStore((s) => s.setBrowseLanguageApiValue);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await loadPlaylistsForLibrary();
    setPlaylists(r.playlists);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (playlists.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !playlists.some((p) => p.id === selectedId)) {
      setSelectedId(playlists[0].id);
    }
  }, [playlists, selectedId]);

  const selected = selectedId ? playlists.find((p) => p.id === selectedId) : undefined;
  const showSearchPane = playlists.length > 0 && Boolean(selected);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <div
        className={
          showSearchPane
            ? `max-h-[min(420px,55%)] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5 ${rootScroll}`
            : `min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5 ${rootScroll}`
        }
      >
        <div className="flex flex-col gap-3 pb-1">
          <p className={cx.intro}>
            <strong className="font-semibold text-inherit">Playlists</strong> are ordered lists of stations. Create several
            for different moods; the player can advance through a playlist when a stream fails to load.
          </p>

          <PlaylistCreateForm
            onCreated={async (pl) => {
              setSelectedId(pl.id);
              await refresh();
            }}
          />

          {playlists.length === 0 ? (
            <p className={cx.muted}>
              You do not have any playlists yet. Create one with the form above, then pick it from the list that appears here
              and add stations from search or other sources.
            </p>
          ) : (
            <>
              <PlaylistPickerList playlists={playlists} selectedId={selectedId} onSelect={setSelectedId} />
              {selected ? (
                <PlaylistEditorCard playlist={selected} client={client} onLibraryChange={refresh} />
              ) : null}
            </>
          )}
        </div>
      </div>

      {showSearchPane && selected ? (
        <section
          className={`flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden border-t pt-3 ${
            surface === "light" ? "border-neutral-200" : "border-neutral-800"
          }`}
          aria-labelledby="playlist-add-search-heading"
        >
          <h2 id="playlist-add-search-heading" className={cx.sectionTitle}>
            Add stations from search
          </h2>
          <p className={cx.intro}>
            Results match the <strong className="font-medium">Browse</strong> tab: exact name vs regex. Tap a row to append
            it to{" "}
            <strong className="font-medium">{sanitizeDisplayText(selected.name, { maxLength: 80 })}</strong> (heart and
            other actions still work as on Browse).
          </p>
          <StationSearchBar
            rawQuery={listsSearch.rawQuery}
            setRawQuery={listsSearch.setRawQuery}
            mode={listsSearch.mode}
            setMode={listsSearch.setMode}
            regexInvalid={listsSearch.regexInvalid}
          />
          <div className="shrink-0">
            <StationLanguageFilter value={browseLanguage} onChange={setBrowseLanguage} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden" aria-label="Station search results for playlist">
            <StationList
              client={client}
              searchQuery={listsSearch.debouncedQuery}
              searchMode={listsSearch.mode}
              regexInvalid={listsSearch.regexInvalid}
              languageFilter={browseLanguage}
              isolated
              appendToPlaylist={{ playlistId: selected.id }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
