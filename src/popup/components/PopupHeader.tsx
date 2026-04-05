import { ExtensionBranding } from "../../shared/components/ExtensionBranding";
import { useSurface } from "../SurfaceContext";

export function PopupHeader() {
  const surface = useSurface();

  const bar =
    surface === "light"
      ? "flex shrink-0 items-center border-b border-neutral-200 bg-white px-3 py-2"
      : "flex shrink-0 items-center border-b border-neutral-800 bg-neutral-950 px-3 py-2";
  const title = surface === "light" ? "text-sm font-semibold text-neutral-900" : "text-sm font-semibold text-neutral-50";
  const sub = "text-xs text-neutral-500";

  return (
    <header className={bar}>
      <ExtensionBranding
        titleClassName={title}
        subtitleClassName={sub}
        markVariant={surface === "light" ? "black" : "white"}
      />
    </header>
  );
}
