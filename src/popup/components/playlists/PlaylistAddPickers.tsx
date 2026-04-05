import { type FormEvent, useEffect, useState } from "react";
import type { RadioBrowserClient } from "../../../shared/api/radio-browser.api";
import type { Playlist } from "../../../shared/types/playlist";
import type { Station } from "../../../shared/types/station";
import { sanitizeDisplayText } from "../../../shared/utils/sanitize";
import {
  appendStationToPlaylist,
  loadCustomStations,
  loadFavouriteIds,
  resolveStationForLibrary,
} from "../../stationLibraryApi";
import { useSurface } from "../../SurfaceContext";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";

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
  const cx = playlistSurfaceCx(surface);
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
    return <p className={cx.intro}>No favourites to add (or all are already in this playlist).</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((id) => (
        <li key={id} className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-sm ${surface === "light" ? "text-neutral-800" : "text-neutral-200"}`}>
            {names[id] ?? "…"}
          </span>
          <button
            type="button"
            className={cx.addRowButton}
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
  const cx = playlistSurfaceCx(surface);
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    void loadCustomStations().then(setStations);
  }, []);

  const missing = stations.filter((s) => !playlist.stationUuids.includes(s.stationuuid));
  if (missing.length === 0) {
    return <p className={cx.intro}>No custom stations to add (or all are already in this playlist).</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {missing.map((s) => (
        <li key={s.stationuuid} className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-sm ${surface === "light" ? "text-neutral-800" : "text-neutral-200"}`}>
            {sanitizeDisplayText(s.name, { maxLength: 120 })}
          </span>
          <button
            type="button"
            className={cx.addRowButton}
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
  const cx = playlistSurfaceCx(surface);
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
        <label className={`min-w-0 flex-1 ${cx.labelBlock}`}>
          Radio Browser <code className={cx.codeMuted}>stationuuid</code> or <code className={cx.codeMuted}>custom:…</code>
          <input
            className={cx.monoInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. uuid or custom:…"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy} className={cx.primaryButton}>
          Add by id
        </button>
      </form>
      {message ? (
        <p className={cx.statusWarn} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** Collapsible: favourites, custom stations, paste-by-id. */
export function PlaylistMoreWaysToAdd({
  playlist,
  client,
  onLibraryChange,
}: {
  playlist: Playlist;
  client: RadioBrowserClient;
  onLibraryChange: () => void;
}) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);

  return (
    <details className={cx.detailsBorder}>
      <summary className={cx.summary}>
        <span className={`mr-2 inline-block align-middle ${cx.chevronMuted}`}>▸</span>
        More ways to add (favourites · custom · by id)
      </summary>
      <div className={`space-y-4 border-t px-2 py-3 ${cx.sepBorderT}`}>
        <div>
          <h4 className={cx.h4}>From favourites</h4>
          <FavouritePickerRows playlist={playlist} client={client} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className={cx.h4}>From custom stations</h4>
          <CustomPickerRows playlist={playlist} onAdded={onLibraryChange} />
        </div>
        <div>
          <h4 className={cx.h4}>By station id</h4>
          <StationUuidImportForm playlist={playlist} client={client} onAdded={onLibraryChange} />
        </div>
      </div>
    </details>
  );
}
