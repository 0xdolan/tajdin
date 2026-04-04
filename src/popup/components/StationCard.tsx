import * as ContextMenu from "@radix-ui/react-context-menu";
import { useState } from "react";
import type { Group } from "../../shared/types/group";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import {
  appendStationToGroup,
  appendStationToPlaylist,
} from "../stationLibraryApi";
import { useStationStore } from "../store/stationStore";

const menuSurface =
  "z-[100] min-w-[11rem] overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 p-1 text-sm text-neutral-100 shadow-xl";
const menuItem =
  "flex cursor-default select-none items-center rounded px-2 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-50";
const subTrigger = `${menuItem} justify-between gap-2`;

function RadioFallbackIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <title>Radio</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.5m0 0v4.125c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18m-9.75-2.25h9.75"
      />
    </svg>
  );
}

function StationFavicon({ favicon }: { favicon?: string }) {
  const [failed, setFailed] = useState(false);
  if (!favicon || failed) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-800 text-neutral-500"
        aria-hidden
      >
        <RadioFallbackIcon />
      </div>
    );
  }
  return (
    <img
      src={favicon}
      alt=""
      className="h-10 w-10 shrink-0 rounded-md bg-neutral-800 object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

export type StationCardProps = {
  station: Station;
  playlists: Playlist[];
  groups: Group[];
  onLibraryMutated?: () => void;
};

export function StationCard({ station, playlists, groups, onLibraryMutated }: StationCardProps) {
  const favouriteIds = useStationStore((s) => s.favouriteIds);
  const toggleFavourite = useStationStore((s) => s.toggleFavourite);
  const isFav = favouriteIds.includes(station.stationuuid);

  const country = station.country ?? station.countrycode ?? "—";
  const lang = station.language ?? station.languagecodes ?? "—";
  const bitrate =
    station.bitrate != null && station.bitrate > 0 ? `${station.bitrate} kbps` : "—";

  const handlePlaylist = (playlistId: string) => {
    void appendStationToPlaylist(station.stationuuid, playlistId).then((ok) => {
      if (ok) onLibraryMutated?.();
    });
  };

  const handleGroup = (groupId: string) => {
    void appendStationToGroup(station.stationuuid, groupId).then((ok) => {
      if (ok) onLibraryMutated?.();
    });
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          data-testid="station-card"
          className="box-border flex h-[72px] cursor-default items-center gap-2 border-b border-neutral-800/90 px-1 py-1.5 outline-none hover:bg-neutral-900/60"
        >
          <StationFavicon favicon={station.favicon} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-100">{station.name}</p>
            <p className="truncate text-xs text-neutral-500">
              {country} · {lang}
            </p>
            <p className="truncate text-xs text-neutral-600">{bitrate}</p>
          </div>
          <button
            type="button"
            data-testid="station-favourite-heart"
            className={`shrink-0 rounded-md p-1.5 transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/80 ${
              isFav ? "text-rose-400" : "text-neutral-500 hover:text-rose-300"
            }`}
            aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
            aria-pressed={isFav}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavourite(station.stationuuid);
            }}
          >
            <HeartIcon filled={isFav} />
          </button>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className={menuSurface}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <ContextMenu.Item
            className={menuItem}
            onSelect={() => toggleFavourite(station.stationuuid)}
          >
            {isFav ? "Remove from favourites" : "Add to favourites"}
          </ContextMenu.Item>
          <ContextMenu.Separator className="my-1 h-px bg-neutral-800" />
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTrigger}>
              Add to playlist
              <span className="text-neutral-500">›</span>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={`${menuSurface} max-h-52 overflow-y-auto`}
                sideOffset={4}
              >
                {playlists.length === 0 ? (
                  <ContextMenu.Item className={menuItem} disabled>
                    No playlists yet
                  </ContextMenu.Item>
                ) : (
                  playlists.map((p) => (
                    <ContextMenu.Item
                      key={p.id}
                      className={menuItem}
                      onSelect={() => handlePlaylist(p.id)}
                    >
                      {p.name}
                    </ContextMenu.Item>
                  ))
                )}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTrigger}>
              Add to group
              <span className="text-neutral-500">›</span>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={`${menuSurface} max-h-52 overflow-y-auto`}
                sideOffset={4}
              >
                {groups.length === 0 ? (
                  <ContextMenu.Item className={menuItem} disabled>
                    No groups yet
                  </ContextMenu.Item>
                ) : (
                  groups.map((g) => (
                    <ContextMenu.Item
                      key={g.id}
                      className={menuItem}
                      onSelect={() => handleGroup(g.id)}
                    >
                      {g.name}
                    </ContextMenu.Item>
                  ))
                )}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
