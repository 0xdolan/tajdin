import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import type { RadioBrowserClient } from "../../../shared/api/radio-browser.api";
import type { Station } from "../../../shared/types/station";
import { sanitizeDisplayText } from "../../../shared/utils/sanitize";
import { removeStationFromPlaylist, resolveStationForLibrary } from "../../stationLibraryApi";
import { useSurface } from "../../SurfaceContext";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm6-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

type Props = {
  uuid: string;
  playlistId: string;
  stationIndex: number;
  client: RadioBrowserClient;
  disabled: boolean;
  onRemoved: () => void;
  onPlay: (station: Station, stationIndex: number) => void;
};

export function PlaylistSortableStationRow({
  uuid,
  playlistId,
  stationIndex,
  client,
  disabled,
  onRemoved,
  onPlay,
}: Props) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);
  const [station, setStation] = useState<Station | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: uuid });
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
    <div ref={setNodeRef} style={style} className={cx.sortRow}>
      <button
        type="button"
        className={cx.grip}
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cx.rowTitle}>{title}</p>
        {!station ? <p className={cx.rowSub}>Loading…</p> : null}
      </div>
      <button
        type="button"
        disabled={disabled || !canPlay || !station}
        className={cx.playBtn}
        onClick={() => station && canPlay && onPlay(station, stationIndex)}
      >
        Play
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cx.removeBtn}
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
