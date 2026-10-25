/** Returns a normalised http(s) URL string, or `undefined` for anything else (javascript:, data:, garbage). */
export function toHttpUrl(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function isHttpUrl(input: unknown): input is string {
  return toHttpUrl(input) !== undefined;
}

export function isInsecureUrl(url: string): boolean {
  return url.startsWith('http://');
}

/** `http://host/x` → `https://host/x`. Many stream hosts answer on both. */
export function upgradeToHttps(url: string): string {
  return isInsecureUrl(url) ? `https://${url.slice('http://'.length)}` : url;
}

export function looksLikeHls(url: string): boolean {
  try {
    return /\.m3u8$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}
