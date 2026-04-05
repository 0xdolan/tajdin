/** Black mark on light backgrounds; white mark on dark backgrounds. */
export type TajdinMarkVariant = "black" | "white";

/**
 * Packaged Tajdîn logo SVG (`public/logo/`). Chrome extension pages resolve via `chrome.runtime.getURL`.
 */
export function tajdinMarkSvgUrl(variant: TajdinMarkVariant): string {
  const file = variant === "black" ? "tajdin-logo-black.svg" : "tajdin-logo-white.svg";
  return typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL(`logo/${file}`)
    : `/logo/${file}`;
}
