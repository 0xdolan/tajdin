/**
 * Defense-in-depth helpers for strings that may come from the Radio Browser API,
 * imported JSON, or user input. React escapes text nodes, but stripping markup and
 * control characters avoids surprises in labels, tooltips, and aria strings.
 */

const DEFAULT_MAX_LENGTH = 2000;

/**
 * Remove ASCII control chars (except tab/newline/carriage return), strip simple HTML-like
 * tags, trim, and cap length. Does not escape for HTML; use in React text content only.
 */
export function sanitizeDisplayText(value: string, options?: { maxLength?: number }): string {
  const max = options?.maxLength ?? DEFAULT_MAX_LENGTH;
  // Strip C0 controls except tab / LF / CR (defense in depth for API-sourced labels).
  // eslint-disable-next-line no-control-regex -- explicit ASCII control removal
  let s = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<[^>]*>/g, "");
  s = s.trim();
  if (s.length > max) {
    s = `${s.slice(0, max)}…`;
  }
  return s;
}

/** Only `http:` / `https:` URLs; anything else yields `undefined` (skip unsafe `src` / `href`). */
export function sanitizeHttpOrHttpsUrl(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return undefined;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
  return u.href;
}

/** List / player artwork: optional custom cover URL wins over Radio Browser `favicon`. */
export function stationArtworkHttpUrl(station: {
  coverUrl?: string | null;
  favicon?: string | null;
}): string | undefined {
  return sanitizeHttpOrHttpsUrl(station.coverUrl ?? undefined) ?? sanitizeHttpOrHttpsUrl(station.favicon ?? undefined);
}
