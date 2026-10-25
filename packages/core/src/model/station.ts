import { z } from 'zod';
import { toHttpUrl } from '../util/url';

export const SOURCE_IDS = [
  'curated',
  'radio-browser',
  'somafm',
  'lautfm',
  'custom',
  'url',
  'local',
] as const;
export const SourceIdSchema = z.enum(SOURCE_IDS);
export type SourceId = z.infer<typeof SourceIdSchema>;

/** Sources whose stations come from a directory (as opposed to the user). */
export const DIRECTORY_SOURCES = ['curated', 'radio-browser', 'somafm', 'lautfm'] as const;
export type DirectorySourceId = (typeof DIRECTORY_SOURCES)[number];

/** Station IDs are `<prefix>:<native id>`, so IDs from different directories never collide. */
export const ID_PREFIX = {
  curated: 'ku',
  'radio-browser': 'rb',
  somafm: 'soma',
  lautfm: 'laut',
  custom: 'custom',
  url: 'url',
  local: 'local',
} as const satisfies Record<SourceId, string>;

export function stationId(source: SourceId, nativeId: string): string {
  return `${ID_PREFIX[source]}:${nativeId}`;
}

export function sourceOf(id: string): SourceId | undefined {
  const prefix = id.slice(0, id.indexOf(':'));
  return (Object.keys(ID_PREFIX) as SourceId[]).find((s) => ID_PREFIX[s] === prefix);
}

export function nativeIdOf(id: string): string {
  return id.slice(id.indexOf(':') + 1);
}

const httpUrl = z.string().transform((value, ctx) => {
  const url = toHttpUrl(value);
  if (!url) {
    ctx.addIssue({ code: 'custom', message: 'Must be an http:// or https:// URL' });
    return z.NEVER;
  }
  return url;
});

/** Optional URL fields degrade to `undefined` instead of failing the whole station. */
const optionalHttpUrl = z
  .unknown()
  .transform((value) => toHttpUrl(value))
  .optional();

export const StationSchema = z.object({
  id: z.string().min(3).max(300),
  source: SourceIdSchema,
  name: z.string().trim().min(1).max(300),
  streamUrl: httpUrl,
  homepage: optionalHttpUrl,
  favicon: optionalHttpUrl,
  description: z.string().max(2000).optional(),
  country: z.string().max(100).optional(),
  countryCode: z.string().max(4).optional(),
  /** Normalised language codes (see `normaliseLanguage`). */
  languages: z.array(z.string().max(40)).max(12).default([]),
  tags: z.array(z.string().max(40)).max(12).default([]),
  codec: z.string().max(20).optional(),
  bitrate: z.number().int().nonnegative().optional(),
  hls: z.boolean().optional(),
});

export type Station = z.output<typeof StationSchema>;
export type StationInput = z.input<typeof StationSchema>;

/**
 * A local audio file picked for this session. It is never persisted or exported,
 * because the user chose not to keep local files between sessions.
 */
export interface LocalStation extends Omit<Station, 'streamUrl' | 'source'> {
  source: 'local';
  /** `local:<id>`; the audio host resolves it to the file it received. */
  streamUrl: string;
  fileName: string;
  /** Local files are seekable, so speed control applies. */
  durationSec?: number;
}

export type AnyStation = Station | LocalStation;

export function isLocalStation(station: AnyStation): station is LocalStation {
  return station.source === 'local';
}

/** Live streams can't be played faster than they're broadcast; files and on-demand audio can. */
export function supportsSpeed(station: AnyStation | null | undefined): boolean {
  return !!station && station.source === 'local';
}

export function parseStation(input: unknown): Station | undefined {
  const result = StationSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
