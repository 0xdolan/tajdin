import { useCallback, useState } from "react";
import { sendPlayerCommand } from "../../playerBridge";
import { usePlayerStore } from "../../store/playerStore";
import type { Station } from "../../../shared/types/station";

function buildStationTooltip(station: Station | null): string | undefined {
  if (!station) return undefined;
  const pieces = [
    station.name,
    station.tags?.trim(),
    station.codec,
    station.bitrate != null && station.bitrate > 0 ? `${station.bitrate} kbps` : null,
    station.country ?? station.countrycode,
    station.language ?? station.languagecodes,
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
}: {
  station: Station | null;
  isPlaying: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const favicon = station?.favicon;

  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-800 text-neutral-500">
      {favicon && !imgFailed ? (
        <img
          src={favicon}
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
              className="zeng-eq-bar block h-3 w-1 rounded-sm bg-emerald-400/95"
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
  const station = usePlayerStore((s) => s.station);
  const streamUrl = usePlayerStore((s) => s.streamUrl);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volumePercent = usePlayerStore((s) => s.volumePercent);
  const muted = usePlayerStore((s) => s.muted);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setVolumePercent = usePlayerStore((s) => s.setVolumePercent);
  const setMuted = usePlayerStore((s) => s.setMuted);

  const [busy, setBusy] = useState(false);

  const effectiveUrl = streamUrl || station?.url_resolved || station?.url || null;
  const canStart = Boolean(effectiveUrl);
  const tooltip = buildStationTooltip(station);

  const togglePlay = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!isPlaying) {
        if (!effectiveUrl) return;
        const loadR = await sendPlayerCommand({ type: "zeng/player/load", url: effectiveUrl });
        if (!loadR.ok) return;
        if (loadR.result.type !== "zeng/player/load" || !loadR.result.data.ok) return;
        const playR = await sendPlayerCommand({ type: "zeng/player/play" });
        if (!playR.ok) return;
        if (playR.result.type === "zeng/player/play" && playR.result.data.ok) {
          setPlaying(true);
        }
      } else {
        const pauseR = await sendPlayerCommand({ type: "zeng/player/pause" });
        if (!pauseR.ok) return;
        if (pauseR.result.type === "zeng/player/pause") {
          setPlaying(false);
        }
      }
    } finally {
      setBusy(false);
    }
  }, [busy, effectiveUrl, isPlaying, setPlaying]);

  const toggleMute = useCallback(async () => {
    const { muted: m, volumePercent: vol } = usePlayerStore.getState();
    if (m) {
      setMuted(false);
      await sendPlayerCommand({ type: "zeng/player/set-volume", volumePercent: vol });
    } else {
      setMuted(true);
      await sendPlayerCommand({ type: "zeng/player/set-volume", volumePercent: 0 });
    }
  }, [setMuted]);

  const onVolumeChange = useCallback(
    (next: number) => {
      const v = Math.min(100, Math.max(0, Math.round(next)));
      setVolumePercent(v);
      setMuted(false);
      void sendPlayerCommand({ type: "zeng/player/set-volume", volumePercent: v });
    },
    [setMuted, setVolumePercent],
  );

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <StationArt station={station} isPlaying={isPlaying} />
      <div
        className="min-w-0 flex-1"
        title={tooltip}
      >
        <p className="truncate text-sm font-medium text-neutral-100">
          {station?.name ?? "No station selected"}
        </p>
        <p className="truncate text-xs text-neutral-500">
          {isPlaying ? "Playing" : "Stopped"}
          {muted ? " · Muted" : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={busy || (!canStart && !isPlaying)}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-100 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={() => void togglePlay()}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={muted}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-neutral-800 ${
          muted ? "text-amber-400" : "text-neutral-300"
        }`}
        onClick={() => void toggleMute()}
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
      </button>
      <label className="flex w-[100px] shrink-0 items-center gap-1.5">
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volumePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePercent}
          className="h-1 w-full cursor-pointer accent-amber-500"
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
