import { z } from "zod";

export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

/** Legacy `"fuzzy"` is coerced to `"exact"` (API name search, no client Fuse pass). */
export const SearchModeSchema = z.preprocess(
  (v) => (v === "fuzzy" ? "exact" : v),
  z.enum(["exact", "regex"]),
);
export type SearchMode = z.infer<typeof SearchModeSchema>;

const preferredBitrate = z.union([z.literal("auto"), z.number().int().positive()]);

const settingsShape = {
  theme: ThemeSchema,
  /** ISO 639-1 or BCP-47 style code, optional. */
  defaultLanguageCode: z.string().min(2).max(16).optional(),
  popupWidthPx: z.number().int().min(200).max(800),
  popupHeightPx: z.number().int().min(300).max(900),
  /** Rough buffer hint for audio pipeline (seconds). */
  audioBufferSizeSeconds: z.number().positive().max(120).optional(),
  searchMode: SearchModeSchema,
  preferredBitrateKbps: preferredBitrate,
  /** Start playback immediately when a station is selected. */
  playbackAutostart: z.boolean(),
  /** User dismissed the one-time welcome tips strip in the popup. */
  welcomePanelDismissed: z.boolean().optional(),
} as const;

/**
 * Strict settings object (no field defaults here — use {@link DEFAULT_SETTINGS} for merges).
 */
export const SettingsSchema = z.object(settingsShape);
export type Settings = z.infer<typeof SettingsSchema>;

/** For chrome.storage merges and import patches (no defaults applied). */
export const SettingsPartialSchema = SettingsSchema.partial();
export type SettingsPartial = z.infer<typeof SettingsPartialSchema>;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  /** Default browse language: ISO `ku` maps to bundled Kurdish station list in the popup. */
  defaultLanguageCode: "ku",
  popupWidthPx: 400,
  popupHeightPx: 600,
  searchMode: "exact",
  preferredBitrateKbps: "auto",
  playbackAutostart: false,
  welcomePanelDismissed: false,
};

/** Parse stored / imported settings merged with defaults. */
export function parseSettingsWithDefaults(input: unknown): Settings {
  const partial = SettingsPartialSchema.parse(input);
  return SettingsSchema.parse({ ...DEFAULT_SETTINGS, ...partial });
}
