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
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  defaultRadioBrowserClient,
  type RadioBrowserClient,
} from "../../shared/api/radio-browser.api";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import { sanitizeDisplayText } from "../../shared/utils/sanitize";
import { startPlaybackWithPlaylistSkip } from "../playerPlayback";
import {
  appendStationToPlaylist,
  createPlaylist,
  deletePlaylist,
  loadCustomStations,
  loadFavouriteIds,
  loadPlaylistsForLibrary,
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

async function resolveCanonicalStationIdForPlaylistImport(
  client: RadioBrowserClient,
  raw: string,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const id = raw.trim();
  if (!id) return { ok: false, message: "Enter a station id." };
  if (id.startsWith("custom:")) {
    const customs = await loadCustomStations();
    if (!customs.some((s) => s.stationuuid === id)) {
      return { ok: false, message: "Custom station not found." };
    }
    return { ok: true, id };
  }
  const st = await client.fetchStationByUuid(id);
  if (!st) return { ok: false, message: "Radio Browser station not found." };
  return { ok: true, id: st.stationuuid };
}

function FavouritePickerRows({
  playlist,
  client,
  onAdded,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onAdded: () => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadFavouriteIds().then(setIds);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const s = await resolveStationForLibrary(client, id);
          return [id, s ? sanitizeDisplayText(s.name, { maxLength: 120 }) : id] as const;
        }),
      );
      if (!cancelled) setNames(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [client, ids]);

  const missing = ids.filter((id) => !playlist.stationUuids.includes(id));
  if (missing.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No favourites to add (or all are already in this playlist).
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((id) => (
        <li key={id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{names[id] ?? "…"}</span>
          <button
            type="button"
            className="shrink-0 rounded px-2 py-1 text-xs text-sky-400 hover:bg-neutral-800"
            onClick={() =>
              void appendStationToPlaylist(id, playlist.id).then((ok) => {
                if (ok) onAdded();
              })
            }
          >
            Add
          </button>
        </li>
      ))}
    </ul>
  );
}

function CustomPickerRows({ playlist, onAdded }: { playlist: Playlist; onAdded: () => void }) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    void loadCustomStations().then(setStations);
  }, []);

  const missing = stations.filter((s) => !playlist.stationUuids.includes(s.stationuuid));
  if (missing.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No custom stations to add (or all are already in this playlist).
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((s) => (
        <li key={s.stationuuid} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">
            {sanitizeDisplayText(s.name, { maxLength: 120 })}
          </span>
          <button
            type="button"
            className="shrink-0 rounded px-2 py-1 text-xs text-sky-400 hover:bg-neutral-800"
            onClick={() =>
              void appendStationToPlaylist(s.stationuuid, playlist.id).then((ok) => {
                if (ok) onAdded();
              })
            }
          >
            Add
          </button>
        </li>
      ))}
    </ul>
  );
}

function StationUuidImportForm({
  playlist,
  client,
  onAdded,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onAdded: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    void (async () => {
      const r = await resolveCanonicalStationIdForPlaylistImport(client, draft);
      if (!r.ok) {
        setMessage(r.message);
        return;
      }
      if (playlist.stationUuids.includes(r.id)) {
        setMessage("Already in this playlist.");
        return;
      }
      const ok = await appendStationToPlaylist(r.id, playlist.id);
      if (ok) {
        setDraft("");
        onAdded();
      } else {
        setMessage("Could not save.");
      }
    })().finally(() => setBusy(false));
  };

  return (
    <div className="space-y-2">
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={onSubmit}>
        <label className="min-w-0 flex-1 text-xs text-neutral-400">
          Radio Browser <code className="text-neutral-500">stationuuid</code> or{" "}
          <code className="text-neutral-500">custom:…</code>
          <input
            className="mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-sm text-neutral-100"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. uuid or custom:…"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-40"
        >
          Add by id
        </button>
      </form>
      {message ? (
        <p className="text-xs text-amber-400" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function PlaylistAddStationsBlock({
  playlist,
  client,
  onLibraryChange,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
}) {
  return (
    <details className="mt-3 rounded-md border border-neutral-800/80 bg-neutral-950/30">
      <summary className="cursor-pointer list-none px-2 py-2 text-sm text-neutral-300 [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block align-middle text-neutral-500">▸</span>
        Add stations (favourites, custom, or by id)
      </summary>
      <div className="space-y-4 border-t border-neutral-800 px-2 py-3">
        <div>
          <h4 className="mb-1 text-xs font-medium text-neutral-400">From favourites</h4>
          <FavouritePickerRows playlist={playlist} client={client} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className="mb-1 text-xs font-medium text-neutral-400">From custom stations</h4>
          <CustomPickerRows playlist={playlist} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className="mb-1 text-xs font-medium text-neutral-400">By station id</h4>
          <StationUuidImportForm playlist={playlist} client={client} onAdded={onLibraryChange} />
        </div>
      </div>
    </details>
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
        <PlaylistAddStationsBlock playlist={playlist} client={client} onLibraryChange={onLibraryChange} />
        {playlist.stationUuids.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No stations in this list yet. Use <strong className="font-medium text-neutral-400">Add stations</strong> above,
            the popup player &quot;add to playlist&quot; control, or right-click a station in Browse / Favourites.
          </p>
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
    void loadPlaylistsForLibrary().then((r) => setPlaylists(r.playlists));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto">
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
