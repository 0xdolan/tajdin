import { z } from 'zod';
import { DIRECTORY_SOURCES } from './station';

export const ThemeSchema = z.enum(['system', 'light', 'dark']);
export type Theme = z.infer<typeof ThemeSchema>;

/** What the popup and desktop view show when they open. */
export const StartViewSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('random') }),
  z.object({ kind: z.literal('favourites') }),
  z.object({ kind: z.literal('language'), language: z.string().min(2).max(40) }),
  z.object({ kind: z.literal('group'), id: z.string().min(1) }),
  z.object({ kind: z.literal('playlist'), id: z.string().min(1) }),
]);
export type StartView = z.infer<typeof StartViewSchema>;

export const BITRATES = ['auto', 64, 128, 192, 256, 320] as const;

export const SettingsSchema = z.object({
  theme: ThemeSchema,
  startView: StartViewSchema,
  /** Directories mixed into the random start view and searched by Browse. */
  sources: z.array(z.enum(DIRECTORY_SOURCES)).min(1),
  /** Language pre-selected in Browse; empty means all languages. */
  defaultLanguage: z.string().max(40),
  searchMode: z.enum(['exact', 'regex']),
  preferredBitrate: z.union([z.literal('auto'), z.literal(64), z.literal(128), z.literal(192), z.literal(256), z.literal(320)]),
  /** Selecting a station starts it immediately (off: it only loads into the player). */
  playOnSelect: z.boolean(),
  /** Desktop view starts a station as soon as it opens (browsers may still require a click). */
  autoplayDesktop: z.boolean(),
  /** Show "now playing" song info from the stream, when the station sends it. */
  showNowPlaying: z.boolean(),
  nowPlayingPosition: z.enum(['top', 'bottom']),
  /** Animate the toolbar icon while a station plays. */
  animatedIcon: z.boolean(),
  /** Hide stations whose last directory health check failed. */
  hideBroken: z.boolean(),
  welcomeDismissed: z.boolean(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  startView: { kind: 'random' },
  sources: ['curated', 'radio-browser', 'somafm', 'lautfm'],
  defaultLanguage: '',
  searchMode: 'exact',
  preferredBitrate: 'auto',
  playOnSelect: true,
  autoplayDesktop: true,
  showNowPlaying: false,
  nowPlayingPosition: 'bottom',
  animatedIcon: true,
  hideBroken: true,
  welcomeDismissed: false,
};

/** Merges stored or imported settings over defaults field by field, dropping invalid fields. */
export function parseSettings(input: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (input && typeof input === 'object') {
    for (const [key, schema] of Object.entries(SettingsSchema.shape)) {
      const value = (input as Record<string, unknown>)[key];
      if (value === undefined) continue;
      const r = (schema as z.ZodType).safeParse(value);
      if (r.success) out[key] = r.data;
    }
  }
  return out as Settings;
}
