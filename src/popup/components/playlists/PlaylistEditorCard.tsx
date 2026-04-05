import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { RadioBrowserClient } from "../../../shared/api/radio-browser.api";
import type { Playlist } from "../../../shared/types/playlist";
import type { Station } from "../../../shared/types/station";
import { listScrollbarClass } from "../../../shared/utils/list-scrollbar";
import { sanitizeDisplayText } from "../../../shared/utils/sanitize";
import { startPlaybackWithPlaylistSkip } from "../../playerPlayback";
import { deletePlaylist, renamePlaylist, reorderPlaylistStations } from "../../stationLibraryApi";
import { usePlayerStore } from "../../store/playerStore";
import { useSurface } from "../../SurfaceContext";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";
import { PlaylistMoreWaysToAdd } from "./PlaylistAddPickers";
import { PlaylistSortableStationRow } from "./PlaylistSortableStationRow";

type Props = {
  playlist: Playlist;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
  /** Called after a successful delete with a snapshot the parent can pass to `restorePlaylist`. */
  onPlaylistDeleted?: (snapshot: Playlist) => void;
};

export function PlaylistEditorCard({ playlist, client, onLibraryChange, onPlaylistDeleted }: Props) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);
  const [nameDraft, setNameDraft] = useState(playlist.name);
  const [dndDisabled, setDndDisabled] = useState(false);
  const rootScroll = listScrollbarClass(surface);

  useEffect(() => {
    setNameDraft(playlist.name);
  }, [playlist.name]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = playlist.stationUuids;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    setDndDisabled(true);
    void reorderPlaylistStations(playlist.id, next).then((ok) => {
      setDndDisabled(false);
      if (ok) onLibraryChange();
    });
  };

  const applyRename = () => {
    void renamePlaylist(playlist.id, nameDraft).then((ok) => {
      if (ok) onLibraryChange();
    });
  };

  const onPlayStation = async (station: Station, stationIndex: number) => {
    usePlayerStore.getState().beginPlaylistPlayback(station, playlist.id, stationIndex);
    await startPlaybackWithPlaylistSkip();
  };

  const confirmDelete = () => {
    const name = sanitizeDisplayText(playlist.name, { maxLength: 80 });
    if (
      typeof globalThis.confirm === "function" &&
      !globalThis.confirm(
        `Delete playlist “${name}”? It will be removed from your library. You can undo for a short time from this tab.`,
      )
    ) {
      return;
    }
    const snapshot: Playlist = {
      ...playlist,
      stationUuids: [...playlist.stationUuids],
    };
    void deletePlaylist(playlist.id).then((ok) => {
      if (ok) {
        onPlaylistDeleted?.(snapshot);
        onLibraryChange();
      }
    });
  };

  return (
    <section className={cx.panel} aria-labelledby="playlist-editor-heading">
      <h2 id="playlist-editor-heading" className={`mb-2 ${cx.sectionTitle}`}>
        Edit playlist
      </h2>
      <p className={`mb-3 ${cx.intro}`}>
        Rename or delete the list, drag the grip handle to reorder, use Play to start from a row, Remove to drop a
        station. Add more from the search block below or open “More ways to add”.
      </p>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className={`min-w-0 flex-1 ${cx.labelBlock}`}>
          Playlist name
          <input
            className={cx.textInput}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft.trim() !== playlist.name) applyRename();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </label>
        <button type="button" className={cx.dangerButton} onClick={confirmDelete}>
          Delete playlist
        </button>
      </div>

      <div className="mb-3">
        <h3 className={`mb-2 ${cx.sectionHeading}`}>Stations in this playlist</h3>
        {playlist.stationUuids.length === 0 ? (
          <p className={cx.muted}>
            No stations yet. Use <strong className="font-medium">Add stations from search</strong> below, the player bar
            menu, Browse / Favourites row actions, or open <strong className="font-medium">More ways to add</strong>.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.stationUuids} strategy={verticalListSortingStrategy}>
              <ul
                className={`flex max-h-48 flex-col gap-2 overflow-y-auto pr-0.5 ${rootScroll}`}
                aria-label={`Stations in ${sanitizeDisplayText(playlist.name, { maxLength: 200 })}`}
              >
                {playlist.stationUuids.map((uuid, index) => (
                  <li key={uuid}>
                    <PlaylistSortableStationRow
                      uuid={uuid}
                      playlistId={playlist.id}
                      stationIndex={index}
                      client={client}
                      disabled={dndDisabled}
                      onRemoved={onLibraryChange}
                      onPlay={(st, idx) => void onPlayStation(st, idx)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <PlaylistMoreWaysToAdd playlist={playlist} client={client} onLibraryChange={onLibraryChange} />
    </section>
  );
}
