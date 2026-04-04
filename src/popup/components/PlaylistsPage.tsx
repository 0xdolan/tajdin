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
import { listScrollbarClass } from "../../shared/utils/list-scrollbar";
import { sanitizeDisplayText } from "../../shared/utils/sanitize";
import { useLocalSearch } from "../hooks/useSearch";
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
import { useSurface } from "../SurfaceContext";
import { usePlayerStore } from "../store/playerStore";
import { useUiStore } from "../store/uiStore";
import { StationLanguageFilter } from "./StationLanguageFilter";
import { StationList } from "./StationList";
import { StationSearchBar } from "./StationSearchBar";

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
  const surface = useSurface();
  const [ids, setIds] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const muted = surface === "light" ? "text-xs text-neutral-500" : "text-xs text-neutral-500";
  const rowText = surface === "light" ? "truncate text-sm text-neutral-800" : "truncate text-sm text-neutral-200";
  const addBtn =
    surface === "light"
      ? "shrink-0 rounded px-2 py-1 text-xs text-sky-700 hover:bg-neutral-200"
      : "shrink-0 rounded px-2 py-1 text-xs text-sky-400 hover:bg-neutral-800";

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
      <p className={muted}>No favourites to add (or all are already in this playlist).</p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((id) => (
        <li key={id} className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 ${rowText}`}>{names[id] ?? "…"}</span>
          <button
            type="button"
            className={addBtn}
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
  const surface = useSurface();
  const [stations, setStations] = useState<Station[]>([]);
  const muted = surface === "light" ? "text-xs text-neutral-500" : "text-xs text-neutral-500";
  const rowText = surface === "light" ? "truncate text-sm text-neutral-800" : "truncate text-sm text-neutral-200";
  const addBtn =
    surface === "light"
      ? "shrink-0 rounded px-2 py-1 text-xs text-sky-700 hover:bg-neutral-200"
      : "shrink-0 rounded px-2 py-1 text-xs text-sky-400 hover:bg-neutral-800";

  useEffect(() => {
    void loadCustomStations().then(setStations);
  }, []);

  const missing = stations.filter((s) => !playlist.stationUuids.includes(s.stationuuid));
  if (missing.length === 0) {
    return (
      <p className={muted}>No custom stations to add (or all are already in this playlist).</p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((s) => (
        <li key={s.stationuuid} className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 ${rowText}`}>
            {sanitizeDisplayText(s.name, { maxLength: 120 })}
          </span>
          <button
            type="button"
            className={addBtn}
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
  const surface = useSurface();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const labelC = surface === "light" ? "text-xs text-neutral-600" : "text-xs text-neutral-400";
  const inputC =
    surface === "light"
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-sm text-neutral-100";
  const codeC = surface === "light" ? "text-neutral-600" : "text-neutral-500";
  const submitC =
    surface === "light"
      ? "shrink-0 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40"
      : "shrink-0 rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-40";

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
        <label className={`min-w-0 flex-1 ${labelC}`}>
          Radio Browser <code className={codeC}>stationuuid</code> or <code className={codeC}>custom:…</code>
          <input
            className={inputC}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. uuid or custom:…"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy} className={submitC}>
          Add by id
        </button>
      </form>
      {message ? (
        <p
          className={surface === "light" ? "text-xs text-amber-700" : "text-xs text-amber-400"}
          role="status"
        >
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
  const surface = useSurface();
  const detailsBorder =
    surface === "light"
      ? "rounded-md border border-neutral-200 bg-white/80"
      : "rounded-md border border-neutral-800/80 bg-neutral-950/30";
  const summaryC =
    surface === "light"
      ? "cursor-pointer list-none px-2 py-2 text-sm text-neutral-700 [&::-webkit-details-marker]:hidden"
      : "cursor-pointer list-none px-2 py-2 text-sm text-neutral-300 [&::-webkit-details-marker]:hidden";
  const chev = surface === "light" ? "text-neutral-400" : "text-neutral-500";
  const h4 = surface === "light" ? "mb-1 text-xs font-medium text-neutral-600" : "mb-1 text-xs font-medium text-neutral-400";
  const sep = surface === "light" ? "border-neutral-200" : "border-neutral-800";

  return (
    <details className={detailsBorder}>
      <summary className={summaryC}>
        <span className={`mr-2 inline-block align-middle ${chev}`}>▸</span>
        More ways to add (favourites, custom, by id)
      </summary>
      <div className={`space-y-4 border-t px-2 py-3 ${sep}`}>
        <div>
          <h4 className={h4}>From favourites</h4>
          <FavouritePickerRows playlist={playlist} client={client} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className={h4}>From custom stations</h4>
          <CustomPickerRows playlist={playlist} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className={h4}>By station id</h4>
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
  const surface = useSurface();
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

  const rowBox =
    surface === "light"
      ? "flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 shadow-sm"
      : "flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1.5";
  const titleC = surface === "light" ? "truncate text-sm text-neutral-900" : "truncate text-sm text-neutral-100";
  const subC = surface === "light" ? "truncate text-xs text-neutral-500" : "truncate text-xs text-neutral-500";
  const gripC =
    surface === "light"
      ? "shrink-0 cursor-grab touch-none rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing disabled:opacity-30"
      : "shrink-0 cursor-grab touch-none rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 active:cursor-grabbing disabled:opacity-30";
  const playC =
    surface === "light"
      ? "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-700 hover:bg-neutral-100 disabled:opacity-40"
      : "shrink-0 rounded px-2 py-1 text-xs font-medium text-sky-400 hover:bg-neutral-800 disabled:opacity-40";
  const removeC =
    surface === "light"
      ? "shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
      : "shrink-0 rounded px-2 py-1 text-xs text-red-400 hover:bg-neutral-800 disabled:opacity-40";

  return (
    <div ref={setNodeRef} style={style} className={rowBox}>
      <button
        type="button"
        className={gripC}
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">
        <p className={titleC}>{title}</p>
        {!station ? <p className={subC}>Loading…</p> : null}
      </div>
      <button
        type="button"
        disabled={disabled || !canPlay || !station}
        className={playC}
        onClick={() => station && canPlay && onPlay(station, stationIndex)}
      >
        Play
      </button>
      <button
        type="button"
        disabled={disabled}
        className={removeC}
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

function PlaylistDetailPanel({
  playlist,
  client,
  onLibraryChange,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
}) {
  const surface = useSurface();
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

  const panelBorder =
    surface === "light"
      ? "rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
      : "rounded-lg border border-neutral-800 bg-neutral-950/40 p-3";
  const labelC = surface === "light" ? "block text-xs text-neutral-600" : "block text-xs text-neutral-400";
  const inputC =
    surface === "light"
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100";
  const deleteBtn =
    surface === "light"
      ? "rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-700 hover:bg-red-50"
      : "rounded-md border border-red-900/60 px-2 py-1.5 text-xs text-red-400 hover:bg-red-950/40";
  const sectionTitle =
    surface === "light" ? "text-xs font-semibold uppercase tracking-wide text-neutral-600" : "text-xs font-semibold uppercase tracking-wide text-neutral-400";
  const hintC = surface === "light" ? "text-sm text-neutral-600" : "text-sm text-neutral-500";

  const confirmDelete = () => {
    const name = sanitizeDisplayText(playlist.name, { maxLength: 80 });
    if (
      typeof globalThis.confirm === "function" &&
      !globalThis.confirm(`Delete playlist “${name}”? This cannot be undone.`)
    ) {
      return;
    }
    void deletePlaylist(playlist.id).then((ok) => {
      if (ok) onLibraryChange();
    });
  };

  return (
    <div className={panelBorder}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className={`min-w-0 flex-1 ${labelC}`}>
          Playlist name
          <input
            className={inputC}
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
        <button type="button" className={deleteBtn} onClick={confirmDelete}>
          Delete playlist
        </button>
      </div>

      <p className={`mb-2 ${hintC}`}>
        Tap a station in the list below to add it to this playlist. Search uses the same exact name and regex modes as
        Browse.
      </p>

      <div className="mb-3">
        <p className={`mb-2 ${sectionTitle}`}>Stations in this playlist</p>
        {playlist.stationUuids.length === 0 ? (
          <p className={hintC}>
            No stations yet. Use the search list, <strong className="font-medium">More ways to add</strong>, the player
            bar, or Browse / Favourites row actions.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.stationUuids} strategy={verticalListSortingStrategy}>
              <ul
                className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-0.5"
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

      <PlaylistAddStationsBlock playlist={playlist} client={client} onLibraryChange={onLibraryChange} />
    </div>
  );
}

export function PlaylistsPage({ client = defaultRadioBrowserClient }: { client?: RadioBrowserClient }) {
  const surface = useSurface();
  const listsSearch = useLocalSearch();
  const browseLanguage = useUiStore((s) => s.browseLanguageApiValue);
  const setBrowseLanguage = useUiStore((s) => s.setBrowseLanguageApiValue);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    void loadPlaylistsForLibrary().then((r) => setPlaylists(r.playlists));
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

  const rootScroll = listScrollbarClass(surface);
  const muted = surface === "light" ? "text-sm text-neutral-600" : "text-sm text-neutral-500";
  const labelSm = surface === "light" ? "text-xs text-neutral-600" : "text-xs text-neutral-400";
  const selectC =
    surface === "light"
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-neutral-100";
  const createInput =
    surface === "light"
      ? "mt-0.5 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900"
      : "mt-0.5 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100";
  const createBtn =
    surface === "light"
      ? "shrink-0 rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600"
      : "shrink-0 rounded-md bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700";
  const sectionHeading =
    surface === "light" ? "text-xs font-semibold text-neutral-700" : "text-xs font-semibold text-neutral-300";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <form
        className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          void createPlaylist(name).then((pl) => {
            if (pl) {
              setNewName("");
              setSelectedId(pl.id);
              refresh();
            }
          });
        }}
      >
        <label className={`min-w-0 flex-1 ${labelSm}`}>
          New playlist
          <input
            className={createInput}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            maxLength={200}
          />
        </label>
        <button type="submit" className={createBtn}>
          Create
        </button>
      </form>

      {playlists.length === 0 ? (
        <p className={muted}>No playlists yet. Create one above, then search and tap stations to fill it.</p>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="shrink-0">
            <label className={labelSm}>
              Active playlist
              <select
                className={selectC}
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                aria-label="Select playlist to edit"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {sanitizeDisplayText(pl.name, { maxLength: 120 })} ({pl.stationUuids.length})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selected ? (
            <>
              <div
                className={`flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden border-b pb-3 ${
                  surface === "light" ? "border-neutral-200" : "border-neutral-800"
                }`}
              >
                <p className={sectionHeading}>Find stations to add</p>
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
                <div className="min-h-0 flex-1 overflow-hidden" aria-label="Station search results">
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
              </div>

              <div
                className={`max-h-[min(320px,45vh)] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden pr-0.5 ${rootScroll}`}
              >
                <PlaylistDetailPanel playlist={selected} client={client} onLibraryChange={refresh} />
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
