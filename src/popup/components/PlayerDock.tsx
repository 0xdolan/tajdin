import { Player } from "./Player/Player";

/**
 * Fixed bottom player bar (72px): transport, mute, volume, artwork + equalizer overlay.
 */
export function PlayerDock() {
  return (
    <footer className="flex h-[72px] shrink-0 items-center gap-3 border-t border-neutral-800 bg-neutral-900/95 px-3 backdrop-blur-sm">
      <Player />
    </footer>
  );
}
