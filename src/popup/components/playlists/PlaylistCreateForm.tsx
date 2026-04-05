import { type FormEvent, useState } from "react";
import type { Playlist } from "../../../shared/types/playlist";
import { createPlaylist } from "../../stationLibraryApi";
import { useSurface } from "../../SurfaceContext";
import { playlistSurfaceCx } from "./playlistSurfaceClasses";

type Props = {
  onCreated: (playlist: Playlist) => void | Promise<void>;
};

/** Name field + “Create playlist” — primary way to add a new list. */
export function PlaylistCreateForm({ onCreated }: Props) {
  const surface = useSurface();
  const cx = playlistSurfaceCx(surface);
  const [name, setName] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    void createPlaylist(trimmed).then(async (pl) => {
      if (pl) {
        setName("");
        await Promise.resolve(onCreated(pl));
      }
    });
  };

  return (
    <section className={cx.panel} aria-labelledby="playlist-create-heading">
      <h2 id="playlist-create-heading" className={`mb-2 ${cx.sectionTitle}`}>
        New playlist
      </h2>
      <p className={`mb-3 ${cx.intro}`}>
        Give it a name, then create. You can add stations from search below or from favourites, custom stations, or by
        id inside the playlist editor.
      </p>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={submit}>
        <label className={`min-w-0 flex-1 ${cx.labelBlock}`}>
          Name
          <input
            className={cx.textInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning jazz"
            maxLength={200}
            autoComplete="off"
          />
        </label>
        <button type="submit" className={cx.primaryButton}>
          Create playlist
        </button>
      </form>
    </section>
  );
}
