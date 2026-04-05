import { z } from "zod";
import { StationSchema, type Station } from "../types/station";
import { sanitizeHttpOrHttpsUrl } from "../utils/sanitize";
import rawRows from "./kurdishCuratedStations.json";

/**
 * Bundled Kurdish station list (Browse language “Kurdish”). IDs are stable for favourites / playlists.
 * Streams are user-contributed; some URLs may change or be non-stream pages over time.
 */
export const KURDISH_CURATED_STATION_ID_PREFIX = "tajdin:kurdish:" as const;

const KurdishCuratedRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  cover: z.string().optional(),
});

const parsedRows = z.array(KurdishCuratedRowSchema).parse(rawRows);

function rowToStation(row: z.infer<typeof KurdishCuratedRowSchema>): Station {
  const url = row.url.trim();
  const coverRaw = row.cover?.trim();
  const coverUrl = coverRaw ? sanitizeHttpOrHttpsUrl(coverRaw) : undefined;
  return StationSchema.parse({
    stationuuid: `${KURDISH_CURATED_STATION_ID_PREFIX}${row.id}`,
    name: row.name.trim(),
    url,
    url_resolved: url,
    tags: "kurdish-curated",
    language: "kurdish",
    ...(coverUrl ? { coverUrl } : {}),
  });
}

export const KURDISH_CURATED_STATIONS: Station[] = parsedRows.map(rowToStation);

const byUuid = new Map(KURDISH_CURATED_STATIONS.map((s) => [s.stationuuid, s] as const));

export function getKurdishCuratedStationByUuid(stationuuid: string): Station | undefined {
  return byUuid.get(stationuuid);
}

export function isKurdishCuratedStationId(stationuuid: string): boolean {
  return stationuuid.startsWith(KURDISH_CURATED_STATION_ID_PREFIX);
}
