import { TAJDIN_TAGLINE_SUBTITLE } from "../constants/branding";
import { type TajdinMarkVariant, tajdinMarkSvgUrl } from "../utils/tajdinMarkUrl";

/**
 * Packaged logo SVG + Tajdîn wordmark + tagline. Used in popup header and options sidebar.
 */
export function ExtensionBranding({
  titleClassName,
  subtitleClassName,
  className = "",
  /** Black on light UI; white on dark UI (e.g. settings sidebar). */
  markVariant = "black",
  /** Use `h1` on full-page options; keep default in popup to avoid duplicate top-level headings in small UIs. */
  titleTag: TitleTag = "div",
}: {
  titleClassName: string;
  subtitleClassName: string;
  className?: string;
  markVariant?: TajdinMarkVariant;
  titleTag?: "div" | "h1";
}) {
  const markUrl = tajdinMarkSvgUrl(markVariant);

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${className}`.trim()}>
      <img
        src={markUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-md object-contain"
        width={32}
        height={32}
      />
      <div className="min-w-0">
        <TitleTag className={titleClassName}>Tajdîn</TitleTag>
        <p className={subtitleClassName}>{TAJDIN_TAGLINE_SUBTITLE}</p>
      </div>
    </div>
  );
}
