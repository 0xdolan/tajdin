/**
 * True if `raw` is a syntactically valid `http:` or `https:` URL (no other schemes).
 */
export function isValidHttpOrHttpsStreamUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return false;
  }
  return u.protocol === "http:" || u.protocol === "https:";
}
