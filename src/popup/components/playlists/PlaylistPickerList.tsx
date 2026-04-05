import type { Playlist } from "../../../shared/types/playlist";
import { listScrollbarClass } from "../../../shared/utils/list-scrollbar";
import { sanitizeDisplayText } from "../../../shared/utils/sanitize";
import { useSurface } from "../../SurfaceContext";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";

type Props = {
  playlists: Playlist[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Visible list of playlists (replaces a single &lt;select&gt;). */
export function PlaylistPickerList({ playlists, selectedId, onSelect }: Props) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);
  const scroll = listScrollbarClass(surface);

  return (
    <section className="min-h-0 shrink-0" aria-labelledby="playlist-pick-heading">
      <h2 id="playlist-pick-heading" className={`mb-2 ${cx.sectionTitle}`}>
        Your playlists
      </h2>
      <p className={`mb-2 ${cx.intro}`}>Tap one to edit it — rename, delete, reorder tracks, or add stations.</p>
      <ul
        className={`flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-0.5 ${scroll}`}
        role="listbox"
        aria-label="Playlists"
      >
        {playlists.map((pl) => {
          const current = pl.id === selectedId;
          const count = pl.stationUuids.length;
          return (
            <li key={pl.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={current}
                className={`${cx.pickerRow} ${current ? cx.pickerRowCurrent : ""}`}
                onClick={() => onSelect(pl.id)}
              >
                <span className={`min-w-0 flex-1 ${cx.pickerName}`}>
                  {sanitizeDisplayText(pl.name, { maxLength: 120 })}
                </span>
                <span className={cx.pickerMeta}>
                  {count} {count === 1 ? "station" : "stations"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
