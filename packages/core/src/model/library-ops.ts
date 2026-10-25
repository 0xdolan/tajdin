import { uuid } from '../util/random';
import { referencedIds, type Colour, type Group, type Library, type Playlist } from './library';
import type { Station } from './station';

/** Pure, immutable library updates. Each returns a new library; callers persist it. */

const now = () => new Date().toISOString();

export function isFavourite(library: Library, id: string): boolean {
  return library.favourites.includes(id);
}

export function toggleFavourite(library: Library, station: Station): Library {
  const has = library.favourites.includes(station.id);
  const next = {
    ...library,
    favourites: has
      ? library.favourites.filter((id) => id !== station.id)
      : [...library.favourites, station.id],
  };
  return has ? pruneCache(next) : rememberStations(next, [station]);
}

/** Reorders favourites (they are also the order the Favourites list plays in). */
export function moveFavourite(library: Library, from: number, to: number): Library {
  if (from === to) return library;
  const ids = [...library.favourites];
  const [moved] = ids.splice(from, 1);
  if (moved === undefined) return library;
  ids.splice(Math.max(0, Math.min(to, ids.length)), 0, moved);
  return { ...library, favourites: ids };
}

export function createPlaylist(
  library: Library,
  input: { name: string; description?: string; colour?: Colour },
): { library: Library; playlist: Playlist } {
  const at = now();
  const playlist: Playlist = {
    id: uuid(),
    name: input.name.trim().slice(0, 200),
    description: input.description?.trim().slice(0, 2000) || undefined,
    colour: input.colour,
    stationIds: [],
    createdAt: at,
    updatedAt: at,
  };
  return { library: { ...library, playlists: [...library.playlists, playlist] }, playlist };
}

export function updatePlaylist(
  library: Library,
  id: string,
  patch: Partial<Pick<Playlist, 'name' | 'description' | 'colour' | 'stationIds'>>,
): Library {
  const next = {
    ...library,
    playlists: library.playlists.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
    ),
  };
  return patch.stationIds ? pruneCache(next) : next;
}

export function deletePlaylist(library: Library, id: string): Library {
  return pruneCache({ ...library, playlists: library.playlists.filter((p) => p.id !== id) });
}

export function addToCollection(
  library: Library,
  kind: 'playlist' | 'group',
  id: string,
  stations: Station[],
): Library {
  const add = (ids: string[]) => [
    ...ids,
    ...stations.map((s) => s.id).filter((sid) => !ids.includes(sid)),
  ];
  const at = now();
  const next: Library =
    kind === 'playlist'
      ? {
          ...library,
          playlists: library.playlists.map((p) =>
            p.id === id ? { ...p, stationIds: add(p.stationIds), updatedAt: at } : p,
          ),
        }
      : {
          ...library,
          groups: library.groups.map((g) =>
            g.id === id ? { ...g, stationIds: add(g.stationIds), updatedAt: at } : g,
          ),
        };
  return rememberStations(next, stations);
}

export function removeFromCollection(
  library: Library,
  kind: 'playlist' | 'group',
  id: string,
  stationId: string,
): Library {
  const at = now();
  const drop = (ids: string[]) => ids.filter((sid) => sid !== stationId);
  const next: Library =
    kind === 'playlist'
      ? {
          ...library,
          playlists: library.playlists.map((p) =>
            p.id === id ? { ...p, stationIds: drop(p.stationIds), updatedAt: at } : p,
          ),
        }
      : {
          ...library,
          groups: library.groups.map((g) =>
            g.id === id ? { ...g, stationIds: drop(g.stationIds), updatedAt: at } : g,
          ),
        };
  return pruneCache(next);
}

export function moveInPlaylist(library: Library, id: string, from: number, to: number): Library {
  const playlist = library.playlists.find((p) => p.id === id);
  if (!playlist || from === to) return library;
  const ids = [...playlist.stationIds];
  const [moved] = ids.splice(from, 1);
  if (moved === undefined) return library;
  ids.splice(Math.max(0, Math.min(to, ids.length)), 0, moved);
  return updatePlaylist(library, id, { stationIds: ids });
}

export type GroupInput =
  | { kind: 'manual'; name: string; colour?: Colour }
  | { kind: 'language'; name: string; colour?: Colour; language: string };

export function createGroup(
  library: Library,
  input: GroupInput,
): { library: Library; group: Group } {
  const at = now();
  const base = {
    id: uuid(),
    name: input.name.trim().slice(0, 200),
    colour: input.colour,
    stationIds: [],
    createdAt: at,
    updatedAt: at,
  };
  const group: Group =
    input.kind === 'language'
      ? { ...base, kind: 'language', language: input.language }
      : { ...base, kind: 'manual' };
  return { library: { ...library, groups: [...library.groups, group] }, group };
}

export function updateGroup(
  library: Library,
  id: string,
  patch: { name?: string; colour?: Colour; language?: string },
): Library {
  return {
    ...library,
    groups: library.groups.map((g) => {
      if (g.id !== id) return g;
      const updated = { ...g, updatedAt: now() };
      if (patch.name !== undefined) updated.name = patch.name.trim().slice(0, 200);
      if (patch.colour !== undefined) updated.colour = patch.colour;
      if (patch.language !== undefined && updated.kind === 'language')
        updated.language = patch.language;
      return updated;
    }),
  };
}

export function deleteGroup(library: Library, id: string): Library {
  return pruneCache({ ...library, groups: library.groups.filter((g) => g.id !== id) });
}

export function upsertCustomStation(library: Library, station: Station): Library {
  const exists = library.customStations.some((s) => s.id === station.id);
  return {
    ...library,
    customStations: exists
      ? library.customStations.map((s) => (s.id === station.id ? station : s))
      : [...library.customStations, station],
  };
}

/** Deleting a custom station also removes it from favourites, playlists and groups. */
export function deleteCustomStation(library: Library, id: string): Library {
  const drop = (ids: string[]) => ids.filter((sid) => sid !== id);
  return {
    ...library,
    customStations: library.customStations.filter((s) => s.id !== id),
    favourites: drop(library.favourites),
    playlists: library.playlists.map((p) =>
      p.stationIds.includes(id) ? { ...p, stationIds: drop(p.stationIds), updatedAt: now() } : p,
    ),
    groups: library.groups.map((g) =>
      g.stationIds.includes(id) ? { ...g, stationIds: drop(g.stationIds), updatedAt: now() } : g,
    ),
  };
}

/** Caches directory stations the library refers to, so it renders offline. */
export function rememberStations(library: Library, stations: Station[]): Library {
  const referenced = referencedIds(library);
  const cache = { ...library.stationCache };
  let changed = false;
  for (const s of stations) {
    if (s.source === 'custom' || !referenced.has(s.id)) continue;
    cache[s.id] = s;
    changed = true;
  }
  return changed ? { ...library, stationCache: cache } : library;
}

export function pruneCache(library: Library): Library {
  const referenced = referencedIds(library);
  const cache = Object.fromEntries(
    Object.entries(library.stationCache).filter(([id]) => referenced.has(id)),
  );
  return { ...library, stationCache: cache };
}
