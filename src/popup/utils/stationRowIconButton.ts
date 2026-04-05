import type { Surface } from "../SurfaceContext";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/80";

/**
 * Shared chrome for station list row icon buttons — aligned with {@link StationFavicon} frame tokens
 * (`rounded-md`, light `bg-neutral-200/90` + border, dark `bg-neutral-800` + border).
 */
function stationRowIconChrome(surface: Surface): string {
  const layout =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors " + focusRing;
  if (surface === "light") {
    return `${layout} border-neutral-300/80 bg-neutral-200/90 hover:bg-neutral-200`;
  }
  return `${layout} border-neutral-700 bg-neutral-800 hover:bg-neutral-700`;
}

/** Default row actions (e.g. add-to-playlist, copy): amber hover on icon color. */
export function stationRowIconButtonClass(surface: Surface): string {
  const chrome = stationRowIconChrome(surface);
  if (surface === "light") {
    return `${chrome} text-neutral-600 hover:text-amber-700`;
  }
  return `${chrome} text-neutral-300 hover:text-amber-300`;
}

/** Favourite heart: same chrome; rose accent when active or on idle hover. */
export function stationRowHeartIconButtonClass(surface: Surface, isFavourite: boolean): string {
  const chrome = stationRowIconChrome(surface);
  if (isFavourite) {
    return `${chrome} text-rose-400`;
  }
  if (surface === "light") {
    return `${chrome} text-neutral-500 hover:text-rose-500`;
  }
  return `${chrome} text-neutral-500 hover:text-rose-300`;
}
