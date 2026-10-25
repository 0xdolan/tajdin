import { useEffect, type WheelEvent } from 'react';
import {
  EllipsisIcon,
  GaugeIcon,
  HeartIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from 'lucide-react';
import { isLocalStation, RATES, supportsSpeed, toggleFavourite, type PlayerState, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@tajdin/ui/components/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@tajdin/ui/components/popover';
import { Slider } from '@tajdin/ui/components/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tajdin/ui/components/tooltip';
import { cn } from '@tajdin/ui/lib/utils';
import { useLibrary, useSettings } from '../data';
import { usePlayer } from '../hooks';
import { StationArt } from './station-art';
import { StationMenu } from './station-menu';
import { stationMeta } from './station-row';

function IconButton({
  label,
  onClick,
  children,
  disabled,
  pressed,
  className,
  size = 'icon-sm',
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  size?: 'icon-sm' | 'icon' | 'icon-lg';
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={cn(pressed && 'text-live', className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function subtitle(state: PlayerState): string {
  const { station, status } = state;
  if (!station) return 'Pick a station to start listening';
  if (status === 'loading') return 'Connecting…';
  if (isLocalStation(station)) return station.fileName;
  return stationMeta(station as Station) || (station.source === 'url' ? station.streamUrl : '');
}

/** Space, N/P, M, R and arrow keys control playback while the page has focus (not while typing). */
export function usePlayerHotkeys(enabled = true) {
  const { state, send } = usePlayer();
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="menu"], [role="dialog"], [role="listbox"]')) return;
      const actions: Record<string, () => void> = {
        ' ': () => void send({ type: 'toggle' }),
        k: () => void send({ type: 'toggle' }),
        n: () => void send({ type: 'next' }),
        p: () => void send({ type: 'previous' }),
        r: () => void send({ type: 'random' }),
        m: () => void send({ type: 'toggleMute' }),
        ArrowUp: () => void send({ type: 'setVolume', volume: Math.min(1, state.volume + 0.05) }),
        ArrowDown: () => void send({ type: 'setVolume', volume: Math.max(0, state.volume - 0.05) }),
      };
      // Space on a focused button should press that button, not toggle playback.
      if (e.key === ' ' && target?.closest('button, a, [role="button"]')) return;
      const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, send, state.volume]);
}

function VolumeControl({ inline }: { inline?: boolean }) {
  const { state, send } = usePlayer();
  const level = state.muted ? 0 : state.volume;
  const Icon = level === 0 ? VolumeXIcon : level < 0.5 ? Volume1Icon : Volume2Icon;
  const onWheel = (e: WheelEvent) => {
    void send({ type: 'setVolume', volume: Math.min(1, Math.max(0, level - Math.sign(e.deltaY) * 0.05)) });
  };
  const slider = (
    <Slider
      aria-label="Volume"
      value={[Math.round(level * 100)]}
      max={100}
      step={1}
      onValueChange={(v) => void send({ type: 'setVolume', volume: (Array.isArray(v) ? v[0]! : v) / 100 })}
      className={inline ? 'w-24' : 'w-36'}
    />
  );
  if (inline) {
    return (
      <div className="flex items-center gap-2" onWheel={onWheel}>
        <IconButton label={state.muted ? 'Unmute (M)' : 'Mute (M)'} onClick={() => void send({ type: 'toggleMute' })}>
          <Icon />
        </IconButton>
        {slider}
      </div>
    );
  }
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Volume ${Math.round(level * 100)}%`} onWheel={onWheel} />}
      >
        <Icon />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="flex w-auto items-center gap-2 p-2">
        <Button variant="ghost" size="icon-sm" aria-label={state.muted ? 'Unmute' : 'Mute'} onClick={() => void send({ type: 'toggleMute' })}>
          <Icon />
        </Button>
        {slider}
        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{Math.round(level * 100)}</span>
      </PopoverContent>
    </Popover>
  );
}

function SpeedControl() {
  const { state, send } = usePlayer();
  const enabled = supportsSpeed(state.station);
  const label = enabled ? `Speed ${state.rate}×` : 'Speed: live radio plays in real time. Available for local files.';
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={label} disabled={!enabled} className="relative" />}
            />
          }
        >
          <GaugeIcon />
          {enabled && state.rate !== 1 && (
            <span className="absolute -top-0.5 -right-0.5 rounded bg-live px-0.5 text-[9px] leading-tight font-semibold text-live-foreground">
              {state.rate}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="top" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={String(state.rate)} onValueChange={(v) => void send({ type: 'setRate', rate: Number(v) })}>
            {RATES.map((r) => (
              <DropdownMenuRadioItem key={r} value={String(r)}>
                {r}×
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The song line. Off by default; shown on top of or below the player per settings. */
export function NowPlayingLine({ className }: { className?: string }) {
  const { state } = usePlayer();
  const [settings] = useSettings();
  if (!settings.showNowPlaying || !state.station) return null;
  const np = state.nowPlaying;
  const text = np ? (np.artist ? `${np.artist} — ${np.title}` : np.title) : state.status === 'playing' ? 'No song info from this station' : '';
  if (!text) return null;
  return (
    <div className={cn('flex min-w-0 items-center gap-2 text-xs', np ? 'text-foreground' : 'text-muted-foreground', className)} aria-live="polite">
      <span className="shrink-0 rounded bg-brand/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-brand uppercase">On air</span>
      <span className="truncate" dir="auto" title={text}>
        {text}
      </span>
    </div>
  );
}

export function Player({ variant = 'compact', className }: { variant?: 'compact' | 'full'; className?: string }) {
  const { state, send } = usePlayer();
  const [library, updateLibrary] = useLibrary();
  const { station, status } = state;
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';
  const canQueue = state.queue.length > 1;
  const favourite = !!station && library.favourites.includes(station.id);
  const seekable = !!station && isLocalStation(station) && state.duration > 0;
  const full = variant === 'full';

  const RepeatGlyph = state.repeat === 'one' ? Repeat1Icon : RepeatIcon;
  const repeatLabel =
    state.repeat === 'off' ? 'Repeat: off' : state.repeat === 'all' ? 'Repeat: whole list' : 'Repeat: this station (reconnects if it drops)';

  const playButton = (
    <Button
      size={full ? 'icon-lg' : 'icon'}
      aria-label={isPlaying || isLoading ? 'Pause (Space)' : 'Play (Space)'}
      onClick={() => void send({ type: 'toggle' })}
      disabled={!station && state.queue.length === 0}
      className={cn('rounded-full', full ? 'size-12' : 'size-10')}
    >
      {isLoading ? <LoaderCircleIcon className="animate-spin" /> : isPlaying ? <PauseIcon className="fill-current" /> : <PlayIcon className="fill-current" />}
    </Button>
  );

  const controls = (
    <div className={cn('flex items-center', full ? 'gap-2' : 'gap-1')}>
      <IconButton label={repeatLabel} pressed={state.repeat !== 'off'} onClick={() => void send({ type: 'cycleRepeat' })}>
        <RepeatGlyph />
      </IconButton>
      <IconButton label="Previous (P)" disabled={!canQueue} onClick={() => void send({ type: 'previous' })}>
        <SkipBackIcon className="fill-current" />
      </IconButton>
      {playButton}
      <IconButton label="Next (N)" disabled={!canQueue} onClick={() => void send({ type: 'next' })}>
        <SkipForwardIcon className="fill-current" />
      </IconButton>
      <IconButton label="Random from this list (R)" disabled={!canQueue} onClick={() => void send({ type: 'random' })}>
        <ShuffleIcon />
      </IconButton>
    </div>
  );

  const progress = seekable ? (
    <div className="flex w-full items-center gap-2 text-[10px] tabular-nums text-muted-foreground">
      <span>{formatTime(state.position)}</span>
      <Slider
        aria-label="Seek"
        value={[state.position]}
        max={state.duration}
        step={1}
        onValueChange={(v) => void send({ type: 'seek', position: Array.isArray(v) ? v[0]! : v })}
      />
      <span>{formatTime(state.duration)}</span>
    </div>
  ) : null;

  const info = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="relative">
        <StationArt station={station} className={full ? 'size-14 rounded-xl' : 'size-12 rounded-xl'} />
        {isPlaying && !isLocalStation(station!) && (
          <span className="absolute -top-1 -left-1 rounded bg-live px-1 text-[9px] leading-4 font-bold tracking-wider text-live-foreground">LIVE</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold" dir="auto" title={station?.name}>
          {station?.name ?? 'Nothing playing'}
        </span>
        <span className="truncate text-xs text-muted-foreground" dir="auto">
          {subtitle(state)}
        </span>
        {state.context && state.context.kind !== 'single' && full && (
          <span className="truncate text-[11px] text-muted-foreground/80" dir="auto">
            from {state.context.label}
          </span>
        )}
      </div>
    </div>
  );

  const stationActions = station && (
    <div className="flex items-center">
      {!isLocalStation(station) && (
        <IconButton
          label={favourite ? 'Remove from favourites' : 'Add to favourites'}
          pressed={favourite}
          onClick={() => void updateLibrary((l) => toggleFavourite(l, station as Station))}
        >
          <HeartIcon className={cn(favourite && 'fill-destructive text-destructive')} />
        </IconButton>
      )}
      <StationMenu
        station={station}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Station actions">
            <EllipsisIcon />
          </Button>
        }
      />
    </div>
  );

  const error = state.error && (
    <p role="alert" className="text-xs text-destructive">
      {state.error}
    </p>
  );

  if (full) {
    return (
      <section aria-label="Player" className={cn('grid grid-cols-[1fr_auto_1fr] items-center gap-4', className)}>
        <div className="flex min-w-0 items-center gap-2">
          {info}
          {stationActions}
        </div>
        <div className="flex flex-col items-center gap-1">
          {controls}
          {progress && <div className="w-80">{progress}</div>}
          {error}
        </div>
        <div className="flex items-center justify-end gap-1">
          <SpeedControl />
          <VolumeControl inline />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Player" className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        {info}
        {stationActions}
      </div>
      {progress}
      {error}
      <div className="flex items-center justify-between">
        <div className="w-16" />
        {controls}
        <div className="flex w-16 items-center justify-end">
          <SpeedControl />
          <VolumeControl />
        </div>
      </div>
    </section>
  );
}
