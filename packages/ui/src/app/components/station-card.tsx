import { memo } from 'react';
import { EllipsisIcon, HeartIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { toggleFavourite, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import { cn } from '@tajdin/ui/lib/utils';
import { useLibrary } from '../data';
import { Equalizer } from './equalizer';
import { StationArt } from './station-art';
import { StationMenu } from './station-menu';
import { stationMeta } from './station-row';

/** Grid tile for the desktop view. */
export const StationCard = memo(function StationCard({
  station,
  active,
  playing,
  onPlay,
}: {
  station: Station;
  active: boolean;
  playing: boolean;
  onPlay: (s: Station) => void;
}) {
  const [library, updateLibrary] = useLibrary();
  const favourite = library.favourites.includes(station.id);
  return (
    <div
      className={cn(
        'group/card bg-card hover:bg-accent relative flex flex-col gap-3 rounded-xl border p-3 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md',
        active && 'ring-live ring-2',
      )}
    >
      <button
        type="button"
        onClick={() => onPlay(station)}
        aria-label={`${active && playing ? 'Playing' : 'Play'} ${station.name}`}
        aria-current={active ? 'true' : undefined}
        className="focus-visible:ring-ring relative aspect-square w-full overflow-hidden rounded-lg outline-none focus-visible:ring-2"
      >
        <StationArt station={station} className="size-full rounded-lg text-2xl" />
        <span
          className={cn(
            'bg-primary text-primary-foreground absolute right-2 bottom-2 flex size-10 items-center justify-center rounded-full shadow-lg transition-[opacity,transform] duration-200',
            active
              ? 'opacity-100'
              : 'translate-y-1 opacity-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100',
          )}
          aria-hidden
        >
          {active && playing ? (
            <PauseIcon className="size-4 fill-current" />
          ) : (
            <PlayIcon className="size-4 fill-current" />
          )}
        </span>
        {active && (
          <span className="bg-background/85 absolute top-2 left-2 rounded-md p-1.5 backdrop-blur">
            <Equalizer playing={playing} />
          </span>
        )}
      </button>
      <div className="flex items-start gap-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn('truncate text-sm font-semibold', active && 'text-live')}
            dir="auto"
            title={station.name}
          >
            {station.name}
          </span>
          <span className="text-muted-foreground truncate text-xs" dir="auto">
            {stationMeta(station) || '\u00a0'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={favourite}
          onClick={() => void updateLibrary((l) => toggleFavourite(l, station))}
        >
          <HeartIcon className={cn(favourite && 'fill-destructive text-destructive')} />
        </Button>
        <StationMenu
          station={station}
          trigger={
            <Button variant="ghost" size="icon-xs" aria-label={`More actions for ${station.name}`}>
              <EllipsisIcon />
            </Button>
          }
        />
      </div>
    </div>
  );
});
