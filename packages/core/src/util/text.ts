// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‍⁠﻿]/g;
const BIDI_OVERRIDES = /[‪-‮⁦-⁩]/g;

/**
 * Cleans text from users and third-party APIs: strips control and bidi-override characters
 * (rendering is done by React, so no HTML escaping is needed here), collapses whitespace, caps length.
 */
export function cleanText(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHARS, '')
    .replace(BIDI_OVERRIDES, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function splitList(input: unknown, maxItems = 12): string[] {
  if (typeof input !== 'string') return [];
  const seen = new Set<string>();
  for (const part of input.split(',')) {
    const value = cleanText(part, 40).toLowerCase();
    if (value) seen.add(value);
    if (seen.size >= maxItems) break;
  }
  return [...seen];
}

/** Compiles a user regex safely; `null` when the pattern is invalid. */
export function compileRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  try {
    return new RegExp(pattern, 'iu');
  } catch {
    return null;
  }
}

/** Accent- and case-insensitive key, so "Kurdî" matches "kurdi". */
export function foldKey(input: string): string {
  return input.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}
