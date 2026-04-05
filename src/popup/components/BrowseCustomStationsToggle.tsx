import { useSurface } from "../SurfaceContext";

type BrowseCustomStationsToggleProps = {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
};

/** Browse tab: show only saved custom streams (no Radio Browser list merge). */
export function BrowseCustomStationsToggle({ pressed, onPressedChange }: BrowseCustomStationsToggleProps) {
  const surface = useSurface();
  const base =
    surface === "light"
      ? "rounded-md border px-2.5 py-1.5 text-sm font-medium shadow-sm transition-colors"
      : "rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors";
  const idle =
    surface === "light"
      ? "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
      : "border-neutral-600 bg-neutral-900 text-neutral-200 hover:bg-neutral-800";
  const active =
    surface === "light"
      ? "border-sky-500 bg-sky-50 text-sky-900"
      : "border-sky-500/80 bg-sky-950/50 text-sky-100";

  return (
    <button
      type="button"
      className={`${base} ${pressed ? active : idle}`}
      aria-pressed={pressed}
      title={pressed ? "Showing custom stations only. Click to browse Radio Browser again." : "Show only your custom stations"}
      onClick={() => onPressedChange(!pressed)}
    >
      Custom only
    </button>
  );
}
