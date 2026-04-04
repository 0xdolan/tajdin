import { useSurface } from "../SurfaceContext";

export function PopupHeader() {
  const surface = useSurface();
  const iconUrl =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("icons/zeng-radio-50.png")
      : "/icons/zeng-radio-50.png";

  const bar =
    surface === "light"
      ? "flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2"
      : "flex shrink-0 items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2";
  const title = surface === "light" ? "text-sm font-semibold text-neutral-900" : "text-sm font-semibold text-neutral-50";
  const sub = surface === "light" ? "text-xs text-neutral-500" : "text-xs text-neutral-500";

  return (
    <header className={bar}>
      <img src={iconUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-contain" width={32} height={32} />
      <div className="min-w-0">
        <div className={title}>Zeng</div>
        <div className={sub}>Worldwide radio · Radio Browser</div>
      </div>
    </header>
  );
}
