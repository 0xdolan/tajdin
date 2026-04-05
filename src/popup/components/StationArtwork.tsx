import { useEffect, useState } from "react";
import { stationArtworkHttpUrl } from "../../shared/utils/sanitize";

export function RadioFallbackIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <title>Radio</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.5m0 0v4.125c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18m-9.75-2.25h9.75"
      />
    </svg>
  );
}

type StationFaviconProps = {
  favicon?: string;
  coverUrl?: string;
  sizeClass?: string;
  /** Browse/favourites list rows: pass popup `SurfaceContext` value; modals/settings omit (defaults to dark). */
  surface?: "dark" | "light";
};

/** Square artwork for list rows (9 = 2.25rem). `coverUrl` (custom station) overrides `favicon`. */
export function StationFavicon({
  favicon,
  coverUrl,
  sizeClass = "h-9 w-9",
  surface = "dark",
}: StationFaviconProps) {
  const [failed, setFailed] = useState(false);
  const safeSrc = stationArtworkHttpUrl({ coverUrl, favicon });
  const frameBg = surface === "light" ? "bg-neutral-200/90" : "bg-neutral-800";
  useEffect(() => {
    setFailed(false);
  }, [safeSrc]);
  if (!safeSrc || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-md ${frameBg} text-neutral-500 ${sizeClass}`}
        aria-hidden
      >
        <RadioFallbackIcon />
      </div>
    );
  }
  return (
    <img
      src={safeSrc}
      alt=""
      className={`shrink-0 rounded-md object-cover ${frameBg} ${sizeClass}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
