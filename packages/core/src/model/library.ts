import { z } from 'zod';
import { StationSchema } from './station';

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Expected an ISO-8601 date');

export const COLOURS = [
  'slate',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'sky',
  'violet',
  'pink',
] as const;
export const ColourSchema = z.enum(COLOURS);
export type Colour = z.infer<typeof ColourSchema>;

export const PlaylistSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  colour: ColourSchema.optional(),
  /** Ordered. */
  stationIds: z.array(z.string().min(1)).max(5000),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Playlist = z.infer<typeof PlaylistSchema>;

/**
 * Groups are unordered collections for browsing. A `language` group is dynamic: it shows every
 * station in that language (curated list first, then the directories) instead of a fixed list.
 */
export const GroupSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('manual'),
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(200),
    colour: ColourSchema.optional(),
    stationIds: z.array(z.string().min(1)).max(5000),
    createdAt: isoDate,
    updatedAt: isoDate,
  }),
  z.object({
    kind: z.literal('language'),
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(200),
    colour: ColourSchema.optional(),
    language: z.string().min(2).max(40),
    /** Extra stations pinned into the group on top of the language results. */
    stationIds: z.array(z.string().min(1)).max(5000).default([]),
    createdAt: isoDate,
    updatedAt: isoDate,
  }),
]);
export type Group = z.infer<typeof GroupSchema>;

export const LibrarySchema = z.object({
  favourites: z.array(z.string().min(1)).max(5000).default([]),
  playlists: z.array(PlaylistSchema).max(500).default([]),
  groups: z.array(GroupSchema).max(500).default([]),
  /** Stations the user added. */
  customStations: z.array(StationSchema).max(5000).default([]),
  /**
   * Last known copy of every directory station referenced by favourites, playlists or groups.
   * The library then works offline and doesn't need a lookup per station on open.
   */
  stationCache: z.record(z.string(), StationSchema).default({}),
});
export type Library = z.output<typeof LibrarySchema>;

export const EMPTY_LIBRARY: Library = {
  favourites: [],
  playlists: [],
  groups: [],
  customStations: [],
  stationCache: {},
};

/** Keeps the parts of a library that are valid and drops the rest, instead of throwing it all away. */
export function parseLibrary(input: unknown): Library {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const list = <T>(value: unknown, schema: z.ZodType<T>): T[] =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          const r = schema.safeParse(item);
          return r.success ? [r.data] : [];
        })
      : [];
  const cache: Library['stationCache'] = {};
  if (raw.stationCache && typeof raw.stationCache === 'object') {
    for (const [id, value] of Object.entries(raw.stationCache)) {
      const r = StationSchema.safeParse(value);
      if (r.success) cache[id] = r.data;
    }
  }
  return {
    favourites: [...new Set(list(raw.favourites, z.string().min(1)))],
    playlists: list(raw.playlists, PlaylistSchema),
    groups: list(raw.groups, GroupSchema),
    customStations: list(raw.customStations, StationSchema),
    stationCache: cache,
  };
}

/** IDs referenced anywhere in the library. Used to prune the station cache. */
export function referencedIds(library: Library): Set<string> {
  const ids = new Set(library.favourites);
  for (const p of library.playlists) for (const id of p.stationIds) ids.add(id);
  for (const g of library.groups) for (const id of g.stationIds) ids.add(id);
  return ids;
}
