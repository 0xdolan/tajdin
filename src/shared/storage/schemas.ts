import { z } from "zod";
import { GroupSchema } from "../types/group";
import { PlaylistSchema } from "../types/playlist";
import { SettingsSchema } from "../types/settings";
import { StationSchema } from "../types/station";

/** Ordered playlists persisted in `chrome.storage.local`. */
export const LocalPlaylistsSchema = z.array(PlaylistSchema);

/** Station groups (organizational, unordered). */
export const LocalGroupsSchema = z.array(GroupSchema);

/** User-added stations not from Radio Browser API. */
export const LocalCustomStationsSchema = z.array(StationSchema);

/** Favourite station ids (`stationuuid` values). */
export const LocalFavouriteIdsSchema = z.array(z.string().min(1));

/** Full settings blob (strict shape; merge with defaults at call sites). */
export const LocalSettingsSchema = SettingsSchema;

/**
 * Transient player state in `chrome.storage.session` (popup + SW sync).
 */
export const SessionPlayerSchema = z.object({
  stationuuid: z.string().min(1).nullable().optional(),
  isPlaying: z.boolean().optional(),
  volumePercent: z.number().int().min(0).max(100).optional(),
});

export type SessionPlayer = z.infer<typeof SessionPlayerSchema>;

/** Popup navigation / lightweight UI flags (session). */
export const SessionUiSchema = z.object({
  activeTab: z.enum(["browse", "favourites", "playlists", "groups"]).optional(),
});

export type SessionUi = z.infer<typeof SessionUiSchema>;
