import { usePlayerStore } from "../store/playerStore";

/**
 * Fixed bottom player chrome (72px). Playback controls land in a later task.
 */
export function PlayerDock() {
  const station = usePlayerStore((s) => s.station);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const label = station?.name ?? "No station selected";

  return (
    <footer className="flex h-[72px] shrink-0 items-center gap-3 border-t border-neutral-800 bg-neutral-900/95 px-3 backdrop-blur-sm">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-500"
        aria-hidden
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <title>Radio</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.5m0 0v4.125c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18m-9.75-2.25h9.75"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-100">{label}</p>
        <p className="text-xs text-neutral-500">
          {isPlaying ? "Playing" : "Stopped"} · Player controls next
        </p>
      </div>
    </footer>
  );
}
