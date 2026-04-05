import { useSurface } from "../SurfaceContext";
import { Player } from "./Player/Player";

/**
 * Fixed bottom player bar: title/subtitle row, then one horizontal controls row (scrolls horizontally if the popup is narrower than content).
 */
export function PlayerDock() {
  const surface = useSurface();
  const footerClass =
    surface === "light"
      ? "flex min-h-0 shrink-0 items-center border-t border-neutral-200 bg-white/95 px-3 py-1.5 backdrop-blur-sm"
      : "flex min-h-0 shrink-0 items-center border-t border-neutral-800 bg-neutral-900/95 px-3 py-1.5 backdrop-blur-sm";

  return (
    <footer className={`${footerClass} w-full min-w-0`}>
      <div className="flex w-full min-w-0 items-center">
        <Player />
      </div>
    </footer>
  );
}
