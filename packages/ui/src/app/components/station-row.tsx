import { memo } from 'react';
import { EllipsisVerticalIcon, HeartIcon, ShieldAlertIcon } from 'lucide-react';
import { isInsecureUrl, languageLabel, toggleFavourite, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tajdin/ui/components/tooltip';
import { cn } from '@tajdin/ui/lib/utils';
import { useLibrary } from '../data';
import { Equalizer } from './equalizer';
import { StationArt } from './station-art';
import { StationMenu } from './station-menu';

export function stationMeta(station: Station): string {
  const parts = [
    station.country,
    station.languages[0] ? languageLabel(station.languages[0]) : undefined,
    station.codec && station.bitrate ? `${station.codec} ${station.bitrate}k` : station.codec,
  ].filter(Boolean);
  if (!parts.length && station.tags.length) parts.push(station.tags.slice(0, 3).join(', '));
  return parts.join(' · ');
}

const SOURCE_LABEL: Partial<Record<Station['source'], string>> = {
  curated: 'Kurdish list',
  somafm: 'SomaFM',
  lautfm: 'laut.fm',
  custom: 'Mine',
};

interface StationRowProps {
  station: Station;
  active: boolean;
  playing: boolean;
  onPlay: (station: Station) => void;
  /** The web app can't reach http-only streams directly; flag them. */
  warnInsecure?: boolean;
  dense?: boolean;
}

/** One station in a list. Click or Enter plays it; the heart and the menu don't. */
export const StationRow = memo(function StationRow({
  station,
  active,
  playing,
  onPlay,
  warnInsecure,
  dense,
}: StationRowProps) {
  const [library, updateLibrary] = useLibrary();
  const favourite = library.favourites.includes(station.id);
  const meta = stationMeta(station);
  const source = SOURCE_LABEL[station.source];
  const insecure = warnInsecure && isInsecureUrl(station.streamUrl);

  return (
    <div
      className={cn(
        'group/row hover:bg-accent flex w-full items-center gap-1 rounded-lg pr-1 transition-colors duration-150',
        dense ? 'h-12' : 'h-14',
        active && 'bg-accent',
      )}
    >
      <button
        type="button"
        aria-current={active ? 'true' : undefined}
        aria-label={`Play ${station.name}${meta ? `, ${meta}` : ''}`}
        onClick={() => onPlay(station)}
        className="focus-visible:ring-ring flex h-full min-w-0 flex-1 items-center gap-3 rounded-lg pl-2 text-left outline-none focus-visible:ring-2"
      >
        <div className="relative">
          <StationArt station={station} className={dense ? 'size-9' : 'size-10'} />
          {active && (
            <span className="bg-background ring-border absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-1">
              <Equalizer playing={playing} className="h-2 gap-px [&>span]:w-[2px]" />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className={cn('truncate text-sm font-medium', active && 'text-live')} dir="auto">
            {station.name}
          </span>
          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            {source && (
              <span className="bg-muted shrink-0 rounded px-1 py-px text-[10px] font-medium">
                {source}
              </span>
            )}
            <span className="truncate" dir="auto">
              {meta}
            </span>
          </span>
        </div>
      </button>
      {insecure && (
        <Tooltip>
          <TooltipTrigger render={<span className="text-muted-foreground px-1" />}>
            <ShieldAlertIcon className="size-4" aria-label="Insecure stream" />
          </TooltipTrigger>
          <TooltipContent>
            http-only stream: it may not play on the website. The extension plays it.
          </TooltipContent>
        </Tooltip>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={
          favourite ? `Remove ${station.name} from favourites` : `Add ${station.name} to favourites`
        }
        aria-pressed={favourite}
        className={cn(
          !favourite &&
            'opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100',
        )}
        onClick={() => void updateLibrary((l) => toggleFavourite(l, station))}
      >
        <HeartIcon className={cn(favourite && 'fill-destructive text-destructive')} />
      </Button>
      <StationMenu
        station={station}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${station.name}`}>
            <EllipsisVerticalIcon />
          </Button>
        }
      />
    </div>
  );
});
