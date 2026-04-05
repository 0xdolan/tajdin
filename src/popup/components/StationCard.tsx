import * as ContextMenu from "@radix-ui/react-context-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useState, type MouseEvent } from "react";
import type { Playlist } from "../../shared/types/playlist";
import type { Station } from "../../shared/types/station";
import { textContainsArabicScript } from "../../shared/utils/arabic-text";
import { sanitizeDisplayText, sanitizeHttpOrHttpsUrl } from "../../shared/utils/sanitize";
import { playStationFromList } from "../browseNavigation";
import { appendStationToPlaylist, loadPlaylistsForLibrary } from "../stationLibraryApi";
import { useSurface } from "../SurfaceContext";
import { usePlayerStore } from "../store/playerStore";
import { useStationStore } from "../store/stationStore";
import { stationRowHeartIconButtonClass, stationRowIconButtonClass } from "../utils/stationRowIconButton";
import { STATION_LIST_ROW_HEIGHT_PX } from "../constants/stationListLayout";
import { AddToPlaylistIcon } from "./AddToPlaylistIcon";
import { StationFavicon } from "./StationArtwork";

function streamUrlForCopy(station: Station): string {
  return (station.url_resolved || station.url || "").trim();
}

function CopyLinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
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
  onLibraryMutated?: () => void;
  /** When set, row activate (click / Enter) appends to this playlist instead of playing. */
  appendToPlaylistOnActivate?: { playlistId: string };
};

export function StationCard({
  station,
  playlists,
  onLibraryMutated,
  appendToPlaylistOnActivate,
}: StationCardProps) {
  const surface = useSurface();
  const favouriteIds = useStationStore((s) => s.favouriteIds);
  const toggleFavourite = useStationStore((s) => s.toggleFavourite);
  const currentUuid = usePlayerStore((s) => s.stationuuid);
  const isFav = favouriteIds.includes(station.stationuuid);
  const isCurrent = currentUuid === station.stationuuid;
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [pickerPlaylists, setPickerPlaylists] = useState<Playlist[]>(playlists);

  useEffect(() => {
    setPickerPlaylists(playlists);
  }, [playlists]);

  const country = sanitizeDisplayText(String(station.country ?? station.countrycode ?? "—"), { maxLength: 120 });
  const lang = sanitizeDisplayText(String(station.language ?? station.languagecodes ?? "—"), { maxLength: 120 });
  const bitrate = station.bitrate != null && station.bitrate > 0 ? `${station.bitrate} kbps` : "—";
  const nameLine = sanitizeDisplayText(station.name, { maxLength: 200 });
  const metaLine = `${country} · ${lang}`;
  const nameAr = textContainsArabicScript(nameLine);
  const metaAr = textContainsArabicScript(metaLine);

  const handlePlaylist = (playlistId: string) => {
    void appendStationToPlaylist(station.stationuuid, playlistId).then((ok) => {
      if (ok) onLibraryMutated?.();
    });
  };

  /** Pointer focus on row actions keeps :focus-within; blur on leave when not keyboard :focus-visible so the strip hides. */
  const handleRowPointerLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    const root = e.currentTarget;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) return;
    try {
      if (typeof active.matches === "function" && active.matches(":focus-visible")) return;
    } catch {
      /* JSDOM may not implement :focus-visible in matches() */
    }
    active.blur();
  };

  const copyStreamLink = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = streamUrlForCopy(station);
    if (!text) {
      setCopyHint("No URL");
      window.setTimeout(() => setCopyHint(null), 2000);
      return;
    }
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyHint("Copied");
        window.setTimeout(() => setCopyHint(null), 2000);
      },
      () => {
        setCopyHint("Failed");
        window.setTimeout(() => setCopyHint(null), 2000);
      },
    );
  };

  const canCopy = Boolean(sanitizeHttpOrHttpsUrl(station.url_resolved || station.url));

  const activateRow = () => {
    if (appendToPlaylistOnActivate) {
      void appendStationToPlaylist(station.stationuuid, appendToPlaylistOnActivate.playlistId).then((ok) => {
        if (ok) onLibraryMutated?.();
      });
      return;
    }
    void playStationFromList(station);
  };

  const rowAriaLabel = appendToPlaylistOnActivate
    ? `Add ${sanitizeDisplayText(station.name, { maxLength: 80 })} to playlist`
    : `Play ${sanitizeDisplayText(station.name, { maxLength: 80 })}`;

  const rowBorder = surface === "light" ? "border-neutral-200/90" : "border-neutral-800/90";
  const rowHover = surface === "light" ? "hover:bg-neutral-200/70" : "hover:bg-neutral-900/60";
  const rowBg = surface === "light" ? "bg-white" : "";
  const titleC = surface === "light" ? "text-neutral-900" : "text-neutral-100";
  const subC = surface === "light" ? "text-neutral-600" : "text-neutral-500";
  const sub2C = surface === "light" ? "text-neutral-500" : "text-neutral-600";
  const currentRing =
    surface === "light"
      ? "bg-amber-500/15 ring-1 ring-inset ring-amber-600/35"
      : "bg-amber-500/10 ring-1 ring-inset ring-amber-500/30";
  const rowIconBtn = stationRowIconButtonClass(surface);
  const rowHeartBtn = stationRowHeartIconButtonClass(surface, isFav);
  const hintC = surface === "light" ? "text-amber-700" : "text-amber-400";
  /** Fade in on row hover/focus; stay visible on touch (no hover). */
  const actionsColOpacity =
    "opacity-0 transition-opacity duration-200 ease-out group-hover/station:opacity-100 group-focus-within/station:opacity-100 [@media(pointer:coarse)]:opacity-100";

  const menuSurface =
    surface === "light"
      ? "z-[100] min-w-[11rem] overflow-hidden rounded-md border border-neutral-200 bg-white p-1 text-sm text-neutral-900 shadow-xl"
      : "z-[100] min-w-[11rem] overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 p-1 text-sm text-neutral-100 shadow-xl";
  const menuItem =
    surface === "light"
      ? "flex cursor-default select-none items-center rounded px-2 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950"
      : "flex cursor-default select-none items-center rounded px-2 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-neutral-800 data-[highlighted]:text-neutral-50";
  const subTrigger = `${menuItem} justify-between gap-2`;
  const sep = surface === "light" ? "my-1 h-px bg-neutral-200" : "my-1 h-px bg-neutral-800";
  const chev = surface === "light" ? "text-neutral-400" : "text-neutral-500";
  const dropdownSurface =
    surface === "light"
      ? "z-[110] max-h-52 min-w-[11rem] overflow-y-auto rounded-md border border-neutral-200 bg-white p-1 text-sm text-neutral-900 shadow-xl"
      : "z-[110] max-h-52 min-w-[11rem] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 p-1 text-sm text-neutral-100 shadow-xl";

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          data-testid="station-card"
          role="button"
          tabIndex={0}
          aria-label={rowAriaLabel}
          aria-current={isCurrent ? "true" : undefined}
          style={{ minHeight: STATION_LIST_ROW_HEIGHT_PX }}
          className={[
            "group/station box-border flex cursor-pointer items-center gap-1.5 overflow-visible border-b px-1 py-1 outline-none",
            rowBorder,
            rowHover,
            rowBg,
            isCurrent ? `ring-1 ring-inset ${currentRing}` : "",
          ].join(" ")}
          onClick={() => void activateRow()}
          onMouseLeave={handleRowPointerLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              void activateRow();
            }
          }}
        >
          <div className="shrink-0">
            <StationFavicon coverUrl={station.coverUrl} favicon={station.favicon} surface={surface} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium leading-tight ${titleC} ${nameAr ? "tajdin-font-arabic" : ""}`}
              dir="auto"
            >
              {nameLine}
            </p>
            <p
              className={`truncate text-xs leading-tight ${subC} ${metaAr ? "tajdin-font-arabic" : ""}`}
              dir="auto"
            >
              {country} · {lang}
            </p>
            <p className={`truncate text-xs leading-tight ${sub2C}`}>{bitrate}</p>
          </div>
          <div className={`relative shrink-0 ${actionsColOpacity}`}>
            <div className="flex flex-row items-center justify-end gap-0.5">
              <button
                type="button"
                data-testid="station-favourite-heart"
                className={rowHeartBtn}
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
              <DropdownMenu.Root
                modal={false}
                onOpenChange={(open) => {
                  if (open) {
                    void loadPlaylistsForLibrary().then((r) => setPickerPlaylists(r.playlists));
                  }
                }}
              >
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    data-testid="station-add-to-playlist"
                    className={rowIconBtn}
                    aria-label="Add station to playlist"
                    title="Add to playlist"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <AddToPlaylistIcon className="h-4 w-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className={dropdownSurface}
                    side="left"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {pickerPlaylists.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-neutral-500">
                        No playlists yet. Create one under Lists or in Settings → Playlists.
                      </p>
                    ) : (
                      pickerPlaylists.map((p) => (
                        <DropdownMenu.Item
                          key={p.id}
                          className={menuItem}
                          onSelect={() => handlePlaylist(p.id)}
                        >
                          {sanitizeDisplayText(p.name, { maxLength: 200 })}
                        </DropdownMenu.Item>
                      ))
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              {canCopy ? (
                <button
                  type="button"
                  data-testid="station-copy-stream"
                  className={rowIconBtn}
                  aria-label="Copy stream URL"
                  title="Copy stream link"
                  onClick={copyStreamLink}
                >
                  <CopyLinkIcon />
                </button>
              ) : null}
            </div>
            {copyHint ? (
              <span
                className={`pointer-events-none absolute right-0 top-full z-10 mt-0.5 whitespace-nowrap text-[10px] ${hintC}`}
                role="status"
              >
                {copyHint}
              </span>
            ) : null}
          </div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={menuSurface} onCloseAutoFocus={(e) => e.preventDefault()}>
          <ContextMenu.Item className={menuItem} onSelect={() => toggleFavourite(station.stationuuid)}>
            {isFav ? "Remove from favourites" : "Add to favourites"}
          </ContextMenu.Item>
          <ContextMenu.Separator className={sep} />
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTrigger}>
              Add to playlist
              <span className={chev}>›</span>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={`${menuSurface} max-h-52 overflow-y-auto`} sideOffset={4}>
                {playlists.length === 0 ? (
                  <ContextMenu.Item className={menuItem} disabled>
                    No playlists yet
                  </ContextMenu.Item>
                ) : (
                  playlists.map((p) => (
                    <ContextMenu.Item key={p.id} className={menuItem} onSelect={() => handlePlaylist(p.id)}>
                      {sanitizeDisplayText(p.name, { maxLength: 200 })}
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
