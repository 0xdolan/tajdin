import { useSurface } from "../SurfaceContext";
import { Player } from "./Player/Player";

/**
 * Fixed bottom player bar: metadata row above artwork + transport (prev / play / next / shuffle), mute, volume.
 */
export function PlayerDock() {
  const surface = useSurface();
  const footerClass =
    surface === "light"
      ? "flex min-h-[88px] shrink-0 items-stretch border-t border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur-sm"
      : "flex min-h-[88px] shrink-0 items-stretch border-t border-neutral-800 bg-neutral-900/95 px-3 py-2 backdrop-blur-sm";

  return (
    <footer className={`${footerClass} w-full`}>
      <div className="flex w-full min-w-0 items-center">
        <Player />
      </div>
    </footer>
  );
}
