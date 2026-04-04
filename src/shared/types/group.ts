import { z } from "zod";

const iso8601Instant = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected ISO-8601 instant string",
});

/**
 * Organizational grouping of stations (unordered / non-playback); distinct from playlists.
 */
export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  stationUuids: z.array(z.string().min(1)),
  /** Heroicons-style icon id for UI (PRD groups). */
  iconKey: z.string().max(120).optional(),
  lastModified: iso8601Instant,
});

export type Group = z.infer<typeof GroupSchema>;
