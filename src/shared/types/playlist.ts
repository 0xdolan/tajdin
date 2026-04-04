import { z } from "zod";

const iso8601Instant = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected ISO-8601 instant string",
});

/**
 * User-defined playlist persisted in chrome.storage (ordered playback list).
 */
export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  /** Optional UI tag (e.g. hex or design token) from PRD playlists. */
  colour: z.string().max(64).optional(),
  stationUuids: z.array(z.string().min(1)),
  lastModified: iso8601Instant,
});

export type Playlist = z.infer<typeof PlaylistSchema>;
