import type { NowPlaying } from '../sources/types';
import { cleanText } from '../util/text';

/** "Artist - Title" → { artist, title }. */
export function parseStreamTitle(raw: string): NowPlaying | null {
  const text = cleanText(raw, 300);
  if (!text || text === '-') return null;
  const split = text.indexOf(' - ');
  if (split > 0) return { artist: text.slice(0, split), title: text.slice(split + 3) };
  return { title: text };
}

export function parseIcyBlock(block: string): NowPlaying | null {
  const match = /StreamTitle='(.*?)';/s.exec(block);
  return match ? parseStreamTitle(match[1] ?? '') : null;
}

/**
 * Reads one ICY metadata block from a Shoutcast/Icecast stream and closes the connection.
 * Polling like this costs a few KB per check instead of a second full audio stream.
 * Returns `undefined` when the stream doesn't send metadata or the browser blocks the request (CORS).
 */
export async function readIcyOnce(
  url: string,
  signal?: AbortSignal,
): Promise<NowPlaying | null | undefined> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 10_000);
  try {
    const res = await fetch(url, {
      headers: { 'Icy-MetaData': '1' },
      signal: controller.signal,
      cache: 'no-store',
    });
    const metaint = Number(res.headers.get('icy-metaint'));
    if (!res.ok || !res.body || !Number.isFinite(metaint) || metaint <= 0 || metaint > 1_000_000)
      return undefined;
    const reader = res.body.getReader();
    let skip = metaint;
    let pending = new Uint8Array(0);
    while (true) {
      const { value, done } = await reader.read();
      if (done || !value) return undefined;
      let chunk = value;
      if (skip > 0) {
        if (chunk.length <= skip) {
          skip -= chunk.length;
          continue;
        }
        chunk = chunk.subarray(skip);
        skip = 0;
      }
      const merged = new Uint8Array(pending.length + chunk.length);
      merged.set(pending);
      merged.set(chunk, pending.length);
      pending = merged;
      const length = (pending[0] ?? 0) * 16;
      if (length === 0) return null;
      if (pending.length >= length + 1) {
        const bytes = pending.subarray(1, length + 1);
        // Most servers send UTF-8; old Shoutcast servers send Latin-1.
        let text: string;
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch {
          text = new TextDecoder('latin1').decode(bytes);
        }
        return parseIcyBlock(text);
      }
    }
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
    controller.abort();
  }
}
