import { useSurface } from "../SurfaceContext";
import { Player } from "./Player/Player";

/**
 * Fixed bottom player bar (72px): transport, mute, volume, artwork + equalizer overlay.
 */
export function PlayerDock() {
  const surface = useSurface();
  const footerClass =
    surface === "light"
      ? "flex h-[72px] shrink-0 items-center gap-3 border-t border-neutral-200 bg-white/95 px-3 backdrop-blur-sm"
      : "flex h-[72px] shrink-0 items-center gap-3 border-t border-neutral-800 bg-neutral-900/95 px-3 backdrop-blur-sm";

  return (
    <footer className={footerClass}>
      <Player />
    </footer>
  );
}
