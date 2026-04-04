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
import type { Station } from "../../../shared/types/station";

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

function RadioGlyph() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.5m0 0v4.125c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18m-9.75-2.25h9.75"
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
  /** Tailwind size utilities, e.g. `h-12 w-12`. */
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
      className={`relative shrink-0 overflow-hidden rounded-md ${frame} ${frameClassName ?? "h-12 w-12"}`}
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
          <RadioGlyph />
        </div>
      )}
      {isPlaying ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-end justify-center gap-0.5 bg-neutral-950/35 pb-1.5"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="tajdin-eq-bar block h-3 w-1 rounded-sm bg-emerald-400/95"
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
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l-3-2.25v12l3-2.25M9 6.75h.008v10.5H9V6.75z"
      />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 12c-1.214 0-2.304-.504-3.09-1.318M19.5 12c0 1.214-.504 2.304-1.318 3.09M4.5 12c1.214 0 2.304.504 3.09 1.318M4.5 12c0-1.214.504-2.304 1.318-3.09M8.25 5.25 9 12l-2.25 6.75M16.5 5.25 14.25 12 16.5 18.75"
      />
    </svg>
  );
}

/** Queue-with-plus: add current station to a playlist. */
function AddToPlaylistIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h12M8 12h8M8 18h5M5 6v.01M5 12v.01M5 18v.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15v6M15 18h6" />
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
        <AddToPlaylistIcon />
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

function SpeakerOffIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L9 6.75v10.5l3.75-2.25M6.75 8.25H4.5v7.5h2.25"
      />
    </svg>
  );
}

export function Player() {
  const surface = useSurface();
  const searchResultsLen = useStationStore((s) => s.searchResults.length);
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
        if (!hasPlayableUrl) {
          const resolved = await ensurePlayerStationResolved();
          if (!resolved) return;
        }
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
  }, [busy, hasPlayableUrl, isPlaying, setPlaying]);

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
      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/95 text-neutral-950 shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40";
  const muteBtn =
    surface === "light"
      ? `flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-neutral-200 ${
          muted ? "text-amber-600" : "text-neutral-600"
        }`
      : `flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-neutral-800 ${
          muted ? "text-amber-400" : "text-neutral-300"
        }`;
  const navBtn =
    surface === "light"
      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-35"
      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35";

  const listNavDisabled = searchResultsLen === 0 || busy;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <div className="min-w-0" title={tooltip}>
        <p
          className={`truncate text-sm font-semibold leading-tight sm:text-[0.95rem] ${titleMain} ${titleArabic ? "tajdin-font-arabic" : ""}`}
          dir="auto"
        >
          {station ? stationTitle : "No station selected"}
        </p>
        <p className={`mt-0.5 truncate text-xs leading-snug ${titleSub}`}>{subtitleLine}</p>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
        <div className="flex min-h-0 min-w-0 max-w-full flex-[1_1_0] flex-wrap items-center gap-x-2 gap-y-1">
          <StationArt station={station} isPlaying={isPlaying} />
          <div
            className="flex min-w-0 flex-[1_1_auto] flex-wrap content-center items-center gap-0.5"
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
              title="Random from current list"
              disabled={listNavDisabled}
              onClick={() => void goToRandomInSearchResults()}
            >
              <ShuffleIcon />
            </button>
            <AddCurrentToPlaylistMenu stationuuid={stationuuid} surface={surface} navBtnClass={navBtn} />
          </div>
        </div>

        <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            className={muteBtn}
            onClick={() => void toggleMute()}
          >
            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
          </button>
          <label className="flex h-9 min-w-[72px] max-w-[100px] shrink-0 items-center gap-1.5">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volumePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercent}
              className="h-1 w-full min-w-0 cursor-pointer accent-amber-500"
              onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
