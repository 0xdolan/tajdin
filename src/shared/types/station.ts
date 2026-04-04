import { z } from "zod";

const bitFlag = z.union([z.literal(0), z.literal(1)]);

/**
 * Radio Browser station row + compatible custom entries (`custom:*` uuids).
 * Unknown API fields are preserved via `.passthrough()` for forward compatibility.
 */
export const StationSchema = z
  .object({
    stationuuid: z.string().min(1),
    name: z.string(),
    url: z.string(),
    url_resolved: z.string().optional(),
    homepage: z.string().optional(),
    /** Optional http(s) image URL for custom stations (shown in lists / player instead of favicon). */
    coverUrl: z.string().optional(),
    favicon: z.string().optional(),
    tags: z.string().optional(),
    country: z.string().optional(),
    countrycode: z.string().optional(),
    state: z.string().optional(),
    language: z.string().optional(),
    languagecodes: z.string().optional(),
    codec: z.string().optional(),
    bitrate: z.number().optional(),
    votes: z.number().optional(),
    clickcount: z.number().optional(),
    clicktrend: z.number().optional(),
    lastcheckok: bitFlag.optional(),
    lastchecktime: z.string().optional(),
    geo_lat: z.number().nullable().optional(),
    geo_long: z.number().nullable().optional(),
    ssl_error: bitFlag.optional(),
    hls: bitFlag.optional(),
    has_extended_info: z.boolean().optional(),
  })
  .passthrough();

export type Station = z.infer<typeof StationSchema>;
