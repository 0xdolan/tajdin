import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useState } from "react";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
} from "../../shared/api/radio-browser.api";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import { sanitizeDisplayText } from "../../shared/utils/sanitize";
import { startPlaybackWithPlaylistSkip } from "../playerPlayback";
import {
  createPlaylist,
  deletePlaylist,
  loadPlaylistsAndGroups,
  removeStationFromPlaylist,
  renamePlaylist,
  reorderPlaylistStations,
  resolveStationForLibrary,
} from "../stationLibraryApi";
import { usePlayerStore } from "../store/playerStore";

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm6-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SortableStationRow({
  uuid,
  playlistId,
  stationIndex,
  client,
  disabled,
  onRemoved,
  onPlay,
}: {
  uuid: string;
  playlistId: string;
  stationIndex: number;
  client: RadioBrowserClient;
  disabled: boolean;
  onRemoved: () => void;
  onPlay: (station: Station, stationIndex: number) => void;
}) {
  const [station, setStation] = useState<Station | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: uuid,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  useEffect(() => {
    let cancelled = false;
    void resolveStationForLibrary(client, uuid).then((s) => {
      if (!cancelled) setStation(s);
    });
    return () => {
      cancelled = true;
    };
  }, [client, uuid]);

  const title = station ? sanitizeDisplayText(station.name, { maxLength: 200 }) : uuid;
  const canPlay = Boolean(station && (station.url_resolved || station.url));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1.5"
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 active:cursor-grabbing disabled:opacity-30"
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-100">{title}</p>
        {!station ? (
          <p className="truncate text-xs text-neutral-500">Loading…</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || !canPlay || !station}
        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-400 hover:bg-neutral-800 disabled:opacity-40"
        onClick={() => station && canPlay && onPlay(station, stationIndex)}
      >
        Play
      </button>
      <button
        type="button"
        disabled={disabled}
        className="shrink-0 rounded px-2 py-1 text-xs text-red-400 hover:bg-neutral-800 disabled:opacity-40"
        onClick={() =>
          void removeStationFromPlaylist(playlistId, uuid).then((ok) => {
            if (ok) onRemoved();
          })
        }
      >
        Remove
      </button>
    </div>
  );
}

function PlaylistSection({
  playlist,
  client,
  onLibraryChange,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
}) {
  const [nameDraft, setNameDraft] = useState(playlist.name);
  const [dndDisabled, setDndDisabled] = useState(false);

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

  return (
    <details className="rounded-lg border border-neutral-800 bg-neutral-950/40">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-neutral-200 [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block align-middle text-neutral-500">▸</span>
        {sanitizeDisplayText(playlist.name, { maxLength: 200 })}
        <span className="ml-2 text-xs font-normal text-neutral-500">
          ({playlist.stationUuids.length} stations)
        </span>
      </summary>
      <div className="border-t border-neutral-800 px-3 py-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-xs text-neutral-400">
            Name
            <input
              className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
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
          <button
            type="button"
            className="rounded-md border border-red-900/60 px-2 py-1.5 text-xs text-red-400 hover:bg-red-950/40"
            onClick={() =>
              void deletePlaylist(playlist.id).then((ok) => {
                if (ok) onLibraryChange();
              })
            }
          >
            Delete playlist
          </button>
        </div>
        {playlist.stationUuids.length === 0 ? (
          <p className="text-sm text-neutral-500">No stations yet. Add some from Browse via the station menu.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.stationUuids} strategy={verticalListSortingStrategy}>
              <ul
                className="flex flex-col gap-2"
                aria-label={`Stations in ${sanitizeDisplayText(playlist.name, { maxLength: 200 })}`}
              >
                {playlist.stationUuids.map((uuid, index) => (
                  <li key={uuid}>
                    <SortableStationRow
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
    </details>
  );
}

export function PlaylistsPage({ client = defaultRadioBrowserClient }: { client?: RadioBrowserClient }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    void loadPlaylistsAndGroups().then((r) => setPlaylists(r.playlists));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          void createPlaylist(name).then((pl) => {
            if (pl) {
              setNewName("");
              refresh();
            }
          });
        }}
      >
        <label className="min-w-0 flex-1 text-xs text-neutral-400">
          New playlist
          <input
            className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            maxLength={200}
          />
        </label>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
        >
          Create
        </button>
      </form>
      {playlists.length === 0 ? (
        <p className="text-sm text-neutral-500">No playlists yet. Create one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {playlists.map((pl) => (
            <PlaylistSection key={pl.id} playlist={pl} client={client} onLibraryChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
