import { useCallback, useEffect, useRef, useState } from "react";
import type { Playlist } from "../../../shared/types/playlist";
import { textContainsArabicScript } from "../../../shared/utils/arabic-text";
import { sanitizeDisplayText, stationArtworkHttpUrl } from "../../../shared/utils/sanitize";
import {
  goToAdjacentInSearchResults,
  goToRandomInSearchResults,
} from "../../browseNavigation";
import { useSurface, type Surface } from "../../SurfaceContext";
import { ensurePlayerStationResolved } from "../../ensurePlayerStationResolved";
import { startPlaybackWithPlaylistSkip } from "../../playerPlayback";
import { sendPlayerCommand } from "../../playerBridge";
import { appendStationToPlaylist, loadPlaylistsForLibrary } from "../../stationLibraryApi";
import { usePlayerStore } from "../../store/playerStore";
import { useStationStore } from "../../store/stationStore";
import { stationRowHeartIconButtonClass } from "../../utils/stationRowIconButton";
import type { Station } from "../../../shared/types/station";
import { AddToPlaylistIcon } from "../AddToPlaylistIcon";
import { HeartIcon } from "../HeartIcon";

function buildStationSubtitle(station: Station | null, isPlaying: boolean, muted: boolean): string {
  if (!station) {
    return muted ? "Muted" : "Browse or search to play";
  }
  const bits: string[] = [];
  const country = station.country ?? station.countrycode;
  const lang = station.language ?? station.languagecodes;
  if (country) bits.push(sanitizeDisplayText(String(country), { maxLength: 48 }));
  if (lang) bits.push(sanitizeDisplayText(String(lang), { maxLength: 48 }));
  if (bits.length === 0 && station.tags?.trim()) {
    bits.push(sanitizeDisplayText(station.tags.trim(), { maxLength: 72 }));
  }
  const meta = bits.join(" · ");
  const state = isPlaying ? "Playing" : "Stopped";
  if (meta) {
    return `${meta} · ${state}${muted ? " · Muted" : ""}`;
  }
  return `${state}${muted ? " · Muted" : ""}`;
}

function buildStationTooltip(station: Station | null): string | undefined {
  if (!station) return undefined;
  const pieces = [
    sanitizeDisplayText(station.name, { maxLength: 200 }),
    station.tags?.trim() ? sanitizeDisplayText(station.tags.trim(), { maxLength: 200 }) : null,
    station.codec ? sanitizeDisplayText(String(station.codec), { maxLength: 80 }) : null,
    station.bitrate != null && station.bitrate > 0 ? `${station.bitrate} kbps` : null,
    station.country ?? station.countrycode
      ? sanitizeDisplayText(String(station.country ?? station.countrycode), { maxLength: 120 })
      : null,
    station.language ?? station.languagecodes
      ? sanitizeDisplayText(String(station.language ?? station.languagecodes), { maxLength: 120 })
      : null,
  ].filter((x): x is string => Boolean(x && String(x).length));
  return pieces.join(" · ");
}

/** Heroicons solid `signal` — reads as broadcast / on-air when no artwork. */
function StationArtPlaceholderGlyph() {
  return (
    <svg className="h-[1.125rem] w-[1.125rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.636 4.575a.75.75 0 0 1 0 1.061 9 9 0 0 0 0 12.728.75.75 0 1 1-1.06 1.06c-4.101-4.1-4.101-10.748 0-14.849a.75.75 0 0 1 1.06 0Zm12.728 0a.75.75 0 0 1 1.06 0c4.101 4.1 4.101 10.75 0 14.85a.75.75 0 1 1-1.06-1.061 9 9 0 0 0 0-12.728.75.75 0 0 1 0-1.06ZM7.757 6.697a.75.75 0 0 1 0 1.06 6 6 0 0 0 0 8.486.75.75 0 0 1-1.06 1.06 7.5 7.5 0 0 1 0-10.606.75.75 0 0 1 1.06 0Zm8.486 0a.75.75 0 0 1 1.06 0 7.5 7.5 0 0 1 0 10.606.75.75 0 0 1-1.06-1.06 6 6 0 0 0 0-8.486.75.75 0 0 1 0-1.06ZM9.879 8.818a.75.75 0 0 1 0 1.06 3 3 0 0 0 0 4.243.75.75 0 1 1-1.061 1.061 4.5 4.5 0 0 1 0-6.364.75.75 0 0 1 1.06 0Zm4.242 0a.75.75 0 0 1 1.061 0 4.5 4.5 0 0 1 0 6.364.75.75 0 0 1-1.06-1.06 3 3 0 0 0 0-4.243.75.75 0 0 1 0-1.061ZM10.875 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StationArt({
  station,
  isPlaying,
  frameClassName,
}: {
  station: Station | null;
  isPlaying: boolean;
  /** Tailwind size utilities, e.g. `h-9 w-9`. */
  frameClassName?: string;
}) {
  const surface = useSurface();
  const [imgFailed, setImgFailed] = useState(false);
  const artworkUrl = station ? stationArtworkHttpUrl(station) : undefined;
  useEffect(() => {
    setImgFailed(false);
  }, [artworkUrl, station?.stationuuid]);
  const frame =
    surface === "light"
      ? "bg-neutral-200/90 text-neutral-500"
      : "bg-neutral-800 text-neutral-500";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-md ${frame} ${frameClassName ?? "h-9 w-9"}`}
    >
      {artworkUrl && !imgFailed ? (
        <img
          src={artworkUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" aria-hidden>
          <StationArtPlaceholderGlyph />
        </div>
      )}
      {isPlaying ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-end justify-center gap-0.5 bg-neutral-950/35 pb-1"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="tajdin-eq-bar block h-2 w-0.5 rounded-sm bg-emerald-400/95"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

/** Heroicons outline `speaker-wave`. */
function SpeakerOnIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
      />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

/** Heroicons outline `arrow-path` — random / reshuffle from list. */
function RandomStationIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  );
}

function AddCurrentToPlaylistMenu({
  stationuuid,
  surface,
  navBtnClass,
}: {
  stationuuid: string | null;
  surface: Surface;
  navBtnClass: string;
}) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refreshPlaylists = useCallback(() => {
    void loadPlaylistsForLibrary().then((r) => setPlaylists(r.playlists));
  }, []);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const menuSurface =
    surface === "light"
      ? "absolute bottom-[calc(100%+6px)] left-0 z-[80] max-h-52 min-w-[12rem] overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 text-sm text-neutral-900 shadow-xl"
      : "absolute bottom-[calc(100%+6px)] left-0 z-[80] max-h-52 min-w-[12rem] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 py-1 text-sm text-neutral-100 shadow-xl";
  const menuItem =
    surface === "light"
      ? "flex w-full cursor-pointer items-center px-3 py-2 text-left hover:bg-neutral-100"
      : "flex w-full cursor-pointer items-center px-3 py-2 text-left hover:bg-neutral-800";

  const pick = (playlistId: string) => {
    if (!stationuuid) return;
    void appendStationToPlaylist(stationuuid, playlistId).then((ok) => {
      if (ok) setOpen(false);
    });
  };

  const disabled = !stationuuid;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        className={navBtnClass}
        disabled={disabled}
        aria-label="Add current station to playlist"
        aria-expanded={open}
        aria-haspopup="menu"
        title={disabled ? "Select a station first" : "Add to playlist"}
        onClick={() => {
          if (disabled) return;
          refreshPlaylists();
          setOpen((v) => !v);
        }}
      >
        <AddToPlaylistIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div className={menuSurface} role="menu">
          {playlists.length === 0 ? (
            <p className="px-3 py-2 text-xs text-neutral-500">
              No playlists yet. Create one under Lists or in Settings → Playlists.
            </p>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                className={menuItem}
                onClick={() => pick(p.id)}
              >
                {sanitizeDisplayText(p.name, { maxLength: 200 })}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Heroicons outline `speaker-x-mark`. */
function SpeakerOffIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
      />
    </svg>
  );
}

export function Player() {
  const surface = useSurface();
  const searchResultsLen = useStationStore((s) => s.searchResults.length);
  const favouriteIds = useStationStore((s) => s.favouriteIds);
  const toggleFavourite = useStationStore((s) => s.toggleFavourite);
  const station = usePlayerStore((s) => s.station);
  const stationuuid = usePlayerStore((s) => s.stationuuid);
  const streamUrl = usePlayerStore((s) => s.streamUrl);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volumePercent = usePlayerStore((s) => s.volumePercent);
  const muted = usePlayerStore((s) => s.muted);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setVolumePercent = usePlayerStore((s) => s.setVolumePercent);
  const setMuted = usePlayerStore((s) => s.setMuted);

  const [busy, setBusy] = useState(false);

  const effectiveUrl = streamUrl || station?.url_resolved || station?.url || null;
  const hasPlayableUrl = Boolean((effectiveUrl || "").trim());
  /** Session may restore `stationuuid` before metadata; Play can resolve on demand. */
  const canStart = hasPlayableUrl || Boolean(stationuuid);
  const tooltip = buildStationTooltip(station);

  const togglePlay = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!isPlaying) {
        await ensurePlayerStationResolved();
        const ok = await startPlaybackWithPlaylistSkip();
        if (!ok) {
          setPlaying(false);
        }
      } else {
        const pauseR = await sendPlayerCommand({ type: "tajdin/player/pause" });
        if (!pauseR.ok) return;
        if (pauseR.result.type === "tajdin/player/pause") {
          setPlaying(false);
        }
      }
    } finally {
      setBusy(false);
    }
  }, [busy, isPlaying, setPlaying]);

  const toggleMute = useCallback(async () => {
    const { muted: m, volumePercent: vol } = usePlayerStore.getState();
    if (m) {
      setMuted(false);
      await sendPlayerCommand({ type: "tajdin/player/set-volume", volumePercent: vol });
    } else {
      setMuted(true);
      await sendPlayerCommand({ type: "tajdin/player/set-volume", volumePercent: 0 });
    }
  }, [setMuted]);

  const onVolumeChange = useCallback(
    (next: number) => {
      const v = Math.min(100, Math.max(0, Math.round(next)));
      setVolumePercent(v);
      setMuted(false);
      void sendPlayerCommand({ type: "tajdin/player/set-volume", volumePercent: v });
    },
    [setMuted, setVolumePercent],
  );

  const titleMain = surface === "light" ? "text-neutral-900" : "text-neutral-100";
  const titleSub = surface === "light" ? "text-neutral-600" : "text-neutral-500";
  const stationTitle = station ? sanitizeDisplayText(station.name, { maxLength: 200 }) : "";
  const titleArabic = stationTitle ? textContainsArabicScript(stationTitle) : false;
  const subtitleLine = buildStationSubtitle(station, isPlaying, muted);
  const playBtn =
    surface === "light"
      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/95 text-neutral-950 shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40";
  const muteBtn =
    surface === "light"
      ? `flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-neutral-200 ${
          muted ? "text-amber-600" : "text-neutral-600"
        }`
      : `flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-neutral-800 ${
          muted ? "text-amber-400" : "text-neutral-300"
        }`;
  const navBtn =
    surface === "light"
      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-35"
      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35";

  const listNavDisabled = searchResultsLen === 0 || busy;
  const isFavourite = Boolean(stationuuid && favouriteIds.includes(stationuuid));
  const favBtnClass = stationRowHeartIconButtonClass(surface, isFavourite);

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div className="min-w-0" title={tooltip}>
        <p
          className={`truncate text-sm font-semibold leading-tight sm:text-[0.95rem] ${titleMain} ${titleArabic ? "tajdin-font-arabic" : ""}`}
          dir="auto"
        >
          {station ? stationTitle : "No station selected"}
        </p>
        <p className={`mt-0.5 truncate text-xs leading-snug ${titleSub}`}>{subtitleLine}</p>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5">
          <StationArt station={station} isPlaying={isPlaying} />
          {stationuuid ? (
            <button
              type="button"
              className={favBtnClass}
              aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
              aria-pressed={isFavourite}
              title={isFavourite ? "Remove from favourites" : "Add to favourites"}
              onClick={() => toggleFavourite(stationuuid)}
            >
              <HeartIcon filled={isFavourite} />
            </button>
          ) : null}
          <div
            className="flex shrink-0 items-center gap-0.5"
            role="group"
            aria-label="Playback and list navigation"
          >
            <button
              type="button"
              className={navBtn}
              aria-label="Previous station in list"
              title="Previous in list (wraps)"
              disabled={listNavDisabled}
              onClick={() => void goToAdjacentInSearchResults(-1)}
            >
              <SkipBackIcon />
            </button>
            <button
              type="button"
              disabled={busy || (!canStart && !isPlaying)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={playBtn}
              onClick={() => void togglePlay()}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className={navBtn}
              aria-label="Next station in list"
              title="Next in list (wraps)"
              disabled={listNavDisabled}
              onClick={() => void goToAdjacentInSearchResults(1)}
            >
              <SkipForwardIcon />
            </button>
            <button
              type="button"
              className={navBtn}
              aria-label="Random station from list"
              title="Random station from current list"
              disabled={listNavDisabled}
              onClick={() => void goToRandomInSearchResults()}
            >
              <RandomStationIcon />
            </button>
            <AddCurrentToPlaylistMenu stationuuid={stationuuid} surface={surface} navBtnClass={navBtn} />
          </div>
        </div>

        <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            className={muteBtn}
            onClick={() => void toggleMute()}
          >
            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
          </button>
          <label className="flex h-8 min-w-[72px] max-w-[108px] shrink-0 items-center gap-1">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volumePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercent}
              className={`tajdin-volume-range h-2 w-full min-w-0 cursor-pointer accent-amber-500 ${
                surface === "light" ? "tajdin-volume-range--light" : "tajdin-volume-range--dark"
              }`}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
