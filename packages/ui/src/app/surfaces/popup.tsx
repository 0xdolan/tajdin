import { useCallback, useState } from 'react';
import {
  FileAudioIcon,
  HeartIcon,
  ListFilterIcon,
  LibraryIcon,
  MonitorIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RadioTowerIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react';
import type { Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tajdin/ui/components/dropdown-menu';
import { Separator } from '@tajdin/ui/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@tajdin/ui/components/tooltip';
import { cn } from '@tajdin/ui/lib/utils';
import { RojMark } from '../components/brand';
import { SearchBar, ShuffleButton, useBrowse, ViewPicker } from '../components/browse';
import { Footer } from '../components/footer';
import { NowPlayingLine, Player, usePlayerHotkeys } from '../components/player';
import { ListToolbar } from '../components/list-toolbar';
import { StationList } from '../components/station-list';
import { WelcomeTips } from '../components/welcome';
import { useSettings } from '../data';
import { useDialogs } from '../dialogs';
import { useStationFeed } from '../feed';
import { usePlayer } from '../hooks';
import { useListTools } from '../list-tools';
import { usePlatform } from '../platform';
import { ThemeMenu } from '../shell';

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Toolbar popup: 400 × 600, the same size as Tajdîn has always had. */
export function PopupApp() {
  const platform = usePlatform();
  const [settings] = useSettings();
  const { state: player, send } = usePlayer();
  const { openPlayAnything, openCustomStation } = useDialogs();
  const browse = useBrowse('tajdin.v2.ui.popup');
  const feed = useStationFeed(browse.view);
  const list = useListTools(feed.stations, JSON.stringify(browse.view));
  const [toolsOpen, setToolsOpen] = useState(false);
  usePlayerHotkeys();

  const playing = player.status === 'playing' || player.status === 'loading';
  const onPlay = useCallback(
    (station: Station) =>
      void send({
        type: settings.playOnSelect ? 'play' : 'load',
        station,
        queue: list.shown,
        context: feed.context,
      }),
    [send, settings.playOnSelect, list.shown, feed.context],
  );

  const searchOpen = browse.state.searchOpen || !!browse.state.query;
  const isMix = browse.view.kind === 'mix';

  return (
    <div className="bg-background flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b px-3">
        <h1 className="flex items-center gap-2">
          <RojMark className="h-[18px] w-auto" live={player.status === 'playing'} />
          <span className="text-[15px] font-semibold tracking-tight">Tajdîn</span>
        </h1>
        <div className="ml-auto flex items-center">
          <HeaderButton
            label={playing ? 'Pause' : 'Play'}
            onClick={() => void send({ type: 'toggle' })}
          >
            {playing ? (
              <PauseIcon className="fill-current" />
            ) : (
              <PlayIcon className="fill-current" />
            )}
          </HeaderButton>
          <ThemeMenu />
          <HeaderButton label="Desktop view" onClick={platform.openDesktop}>
            <MonitorIcon />
          </HeaderButton>
          <HeaderButton
            label="Options: stations, playlists, groups, backup"
            onClick={() => platform.openSettings?.('stations')}
          >
            <LibraryIcon />
          </HeaderButton>
          <HeaderButton label="Settings" onClick={() => platform.openSettings?.('general')}>
            <SettingsIcon />
          </HeaderButton>
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-1 px-2 pt-2">
        <ViewPicker view={browse.view} onChange={browse.setView} className="max-w-[210px]" />
        <div className="ml-auto flex items-center">
          {isMix ? (
            <ShuffleButton onClick={feed.reload} />
          ) : (
            <HeaderButton label="Reload" onClick={feed.reload}>
              <RefreshCwIcon />
            </HeaderButton>
          )}
          <HeaderButton
            label={browse.view.kind === 'favourites' ? 'Back to the random mix' : 'Favourites'}
            onClick={() =>
              browse.setView(
                browse.view.kind === 'favourites'
                  ? { kind: 'mix', language: '' }
                  : { kind: 'favourites' },
              )
            }
          >
            <HeartIcon
              className={cn(
                browse.view.kind === 'favourites' && 'fill-destructive text-destructive',
              )}
            />
          </HeaderButton>
          <HeaderButton
            label={toolsOpen || list.active ? 'Hide sort and filter' : 'Sort and filter this list'}
            onClick={() => {
              if (toolsOpen) list.reset();
              setToolsOpen(!toolsOpen);
            }}
          >
            <span className="relative">
              <ListFilterIcon />
              {list.active > 0 && (
                <span className="bg-primary absolute -top-1 -right-1 size-2 rounded-full" />
              )}
            </span>
          </HeaderButton>
          <HeaderButton
            label={searchOpen ? 'Close search' : 'Search all stations'}
            onClick={() =>
              browse.setState((s) => ({
                ...s,
                searchOpen: !searchOpen,
                query: searchOpen ? '' : s.query,
              }))
            }
          >
            {searchOpen ? <XIcon /> : <SearchIcon />}
          </HeaderButton>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Add or play" />}
            >
              <PlusIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={openPlayAnything}>
                  <FileAudioIcon />
                  Play a link or file…
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCustomStation()}>
                  <RadioTowerIcon />
                  Add a station…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {searchOpen && <SearchBar browse={browse} autoFocus className="shrink-0 px-3 pt-1 pb-1" />}
      {(toolsOpen || list.active > 0) && (
        <ListToolbar
          list={list}
          className="shrink-0 px-3 pt-1 pb-1"
          count={{ shown: list.shown.length, total: feed.stations.length }}
        />
      )}
      {!settings.welcomeDismissed && <WelcomeTips className="mx-3 mt-1" />}

      <StationList
        feed={browse.ready ? { ...feed, stations: list.shown } : { ...feed, status: 'loading' }}
        onPlay={onPlay}
        dense
        className="mt-1 min-h-0 flex-1"
        empty={emptyFor(browse.view.kind, openCustomStation)}
      />

      <div className={cn('bg-card/60 shrink-0 border-t px-3 pt-2 pb-1.5 backdrop-blur')}>
        {settings.nowPlayingPosition === 'top' && <NowPlayingLine className="mb-1.5" />}
        <Player />
        {settings.nowPlayingPosition === 'bottom' && <NowPlayingLine className="mt-1" />}
      </div>
      <Separator />
      <Footer className="h-7 shrink-0" />
    </div>
  );
}

function emptyFor(kind: string, addStation: () => void) {
  switch (kind) {
    case 'favourites':
      return {
        title: 'No favourites yet',
        description: 'Tap the heart on any station to keep it here.',
      };
    case 'playlist':
      return { title: 'This playlist is empty', description: 'Use a station’s ⋮ menu to add it.' };
    case 'group':
      return { title: 'This group is empty', description: 'Use a station’s ⋮ menu to add it.' };
    case 'custom':
      return {
        title: 'No stations of your own',
        description: 'Add any stream URL and it works like every other station.',
        action: (
          <Button size="sm" onClick={addStation}>
            <PlusIcon data-icon="inline-start" />
            Add a station
          </Button>
        ),
      };
    case 'search':
      return {
        title: 'No matches',
        description: 'Try fewer words, another language, or regex mode.',
      };
    default:
      return { title: 'No stations found' };
  }
}
