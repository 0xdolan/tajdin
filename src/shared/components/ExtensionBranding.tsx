/**
 * Packaged icon + Tajdîn wordmark + tagline (Radio Browser). Used in popup header and options sidebar.
 */
export function ExtensionBranding({
  titleClassName,
  subtitleClassName,
  className = "",
  /** Use `h1` on full-page options; keep default in popup to avoid duplicate top-level headings in small UIs. */
  titleTag: TitleTag = "div",
}: {
  titleClassName: string;
  subtitleClassName: string;
  className?: string;
  titleTag?: "div" | "h1";
}) {
  const iconUrl =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("icons/tajdin-radio-50.png")
      : "/icons/tajdin-radio-50.png";

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
      <img
        src={iconUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-md object-contain"
        width={32}
        height={32}
      />
      <div className="min-w-0">
        <TitleTag className={titleClassName}>Tajdîn</TitleTag>
        <p className={subtitleClassName}>Worldwide radio · Radio Browser</p>
      </div>
    </div>
  );
}
