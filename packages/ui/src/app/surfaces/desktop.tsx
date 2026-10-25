import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DownloadIcon,
  FileAudioIcon,
  FolderPlusIcon,
  GlobeIcon,
  HeartIcon,
  LanguagesIcon,
  ListMusicIcon,
  ListPlusIcon,
  PlayIcon,
  RadioTowerIcon,
  RefreshCwIcon,
  SettingsIcon,
  ShapesIcon,
  SparklesIcon,
} from 'lucide-react';
import { LANGUAGES, type Station } from '@tajdin/core';
import { Button } from '@tajdin/ui/components/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tajdin/ui/components/empty';
import { ScrollArea } from '@tajdin/ui/components/scroll-area';
import { Skeleton } from '@tajdin/ui/components/skeleton';
import { Spinner } from '@tajdin/ui/components/spinner';
import { cn } from '@tajdin/ui/lib/utils';
import { RojMark } from '../components/brand';
import { SearchBar, ShuffleButton, useBrowse, ViewPicker } from '../components/browse';
import { COLOUR_SWATCH } from '../components/collection-dialog';
import { Footer } from '../components/footer';
import { NowPlayingLine, Player, usePlayerHotkeys } from '../components/player';
import { StationArt } from '../components/station-art';
import { ListToolbar } from '../components/list-toolbar';
import { StationCard } from '../components/station-card';
import { useLibrary, useSettings } from '../data';
import { useDialogs } from '../dialogs';
import { useStationFeed, viewLabel, type View } from '../feed';
import { usePlayer } from '../hooks';
import { useListTools } from '../list-tools';
import { usePlatform } from '../platform';
import { ThemeMenu } from '../shell';

function NavItem({
  active,
  onClick,
  icon,
  label,
  count,
  colour,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  colour?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'hover:bg-accent focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 [&_svg]:size-4 [&_svg]:shrink-0',
        active ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground',
      )}
      style={colour ? ({ '--tw-colour': colour } as React.CSSProperties) : undefined}
    >
      <span style={colour ? { color: colour } : undefined}>{icon}</span>
      <span className="flex-1 truncate text-left" dir="auto">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
      )}
    </button>
  );
}

function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const [library] = useLibrary();
  const { openCollection, openPlayAnything, openCustomStation } = useDialogs();
  const { kind, storeLinks } = usePlatform();
  const [allLanguages, setAllLanguages] = useState(false);
  const is = (v: View) => JSON.stringify(v) === JSON.stringify(view);
  const heading = (text: string, action?: React.ReactNode) => (
    <div className="flex items-center justify-between px-2.5 pt-4 pb-1">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {text}
      </span>
      {action}
    </div>
  );
  return (
    <ScrollArea className="h-full">
      <nav aria-label="Library" className="flex flex-col gap-0.5 p-3">
        {heading('Discover')}
        <NavItem
          active={is({ kind: 'mix', language: '' })}
          onClick={() => onChange({ kind: 'mix', language: '' })}
          icon={<SparklesIcon />}
          label="Random mix"
        />
        <NavItem
          active={is({ kind: 'language', language: 'ku' })}
          onClick={() => onChange({ kind: 'language', language: 'ku' })}
          icon={<GlobeIcon />}
          label="Kurdish · Kurdî"
        />
        {(allLanguages
          ? LANGUAGES.filter((l) => l.code !== 'ku')
          : LANGUAGES.filter((l) => ['ar', 'fa', 'tr', 'en'].includes(l.code))
        ).map((l) => (
          <NavItem
            key={l.code}
            active={is({ kind: 'language', language: l.code })}
            onClick={() => onChange({ kind: 'language', language: l.code })}
            icon={<LanguagesIcon />}
            label={l.name}
          />
        ))}
        <Button
          variant="link"
          size="xs"
          className="self-start"
          onClick={() => setAllLanguages(!allLanguages)}
        >
          {allLanguages ? 'Fewer languages' : 'All languages'}
        </Button>

        {heading('Library')}
        <NavItem
          active={is({ kind: 'favourites' })}
          onClick={() => onChange({ kind: 'favourites' })}
          icon={<HeartIcon />}
          label="Favourites"
          count={library.favourites.length}
        />
        <NavItem
          active={is({ kind: 'custom' })}
          onClick={() => onChange({ kind: 'custom' })}
          icon={<RadioTowerIcon />}
          label="My stations"
          count={library.customStations.length}
        />

        {heading(
          'Playlists',
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="New playlist"
            onClick={() => openCollection({ mode: 'create', kind: 'playlist' })}
          >
            <ListPlusIcon />
          </Button>,
        )}
        {library.playlists.map((p) => (
          <NavItem
            key={p.id}
            active={is({ kind: 'playlist', id: p.id })}
            onClick={() => onChange({ kind: 'playlist', id: p.id })}
            icon={<ListMusicIcon />}
            label={p.name}
            count={p.stationIds.length}
            colour={p.colour ? COLOUR_SWATCH[p.colour] : undefined}
          />
        ))}

        {heading(
          'Groups',
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="New group"
            onClick={() => openCollection({ mode: 'create', kind: 'group' })}
          >
            <FolderPlusIcon />
          </Button>,
        )}
        {library.groups.map((g) => (
          <NavItem
            key={g.id}
            active={is({ kind: 'group', id: g.id })}
            onClick={() => onChange({ kind: 'group', id: g.id })}
            icon={g.kind === 'language' ? <LanguagesIcon /> : <ShapesIcon />}
            label={g.name}
            count={g.kind === 'manual' ? g.stationIds.length : undefined}
            colour={g.colour ? COLOUR_SWATCH[g.colour] : undefined}
          />
        ))}

        {heading('Add')}
        <NavItem
          active={false}
          onClick={openPlayAnything}
          icon={<FileAudioIcon />}
          label="Play a link or file"
        />
        <NavItem
          active={false}
          onClick={() => openCustomStation()}
          icon={<RadioTowerIcon />}
          label="Add a station"
        />

        {kind === 'web' && storeLinks.length > 0 && (
          <div className="bg-card mt-4 flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Keep it in your toolbar</p>
            <p className="text-muted-foreground text-xs">
              The extension plays every station (including http ones) and keeps playing when you
              close the tab.
            </p>
            {storeLinks.map((s) => (
              <Button
                key={s.href}
                size="sm"
                variant="outline"
                render={<a href={s.href} target="_blank" rel="noreferrer" />}
              >
                <DownloadIcon data-icon="inline-start" />
                {s.label}
              </Button>
            ))}
          </div>
        )}
      </nav>
    </ScrollArea>
  );
}

function Grid({
  feed,
  onPlay,
}: {
  feed: ReturnType<typeof useStationFeed>;
  onPlay: (s: Station) => void;
}) {
  const { state } = usePlayer();
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && feed.loadMore(),
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [feed]);

  if (feed.status === 'loading') {
    return (
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:gap-4"
        aria-busy="true"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (feed.status === 'error' || feed.stations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RadioTowerIcon />
          </EmptyMedia>
          <EmptyTitle>
            {feed.status === 'error' ? 'Couldn’t load stations' : 'Nothing here yet'}
          </EmptyTitle>
          <EmptyDescription>
            {feed.error ?? 'Pick another list, or add stations from any station’s ⋮ menu.'}
          </EmptyDescription>
        </EmptyHeader>
        {feed.status === 'error' && (
          <Button variant="outline" size="sm" onClick={feed.reload}>
            Try again
          </Button>
        )}
      </Empty>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:gap-4">
        {feed.stations.map((s) => (
          <StationCard
            key={s.id}
            station={s}
            active={state.station?.id === s.id}
            playing={state.status === 'playing'}
            onPlay={onPlay}
          />
        ))}
      </div>
      <div
        ref={sentinel}
        className="text-muted-foreground flex h-16 items-center justify-center text-sm"
      >
        {feed.loadingMore && (
          <>
            <Spinner className="mr-2" /> Loading more…
          </>
        )}
      </div>
    </>
  );
}

/** Full-window player: the extension's desktop tab and the GitHub Pages site. */
export function DesktopApp() {
  const platform = usePlatform();
  const [settings] = useSettings();
  const [library] = useLibrary();
  const { state: player, send } = usePlayer();
  const browse = useBrowse(`tajdin.v2.ui.desktop`);
  const feed = useStationFeed(browse.view);
  const list = useListTools(feed.stations, JSON.stringify(browse.view));
  const [needsTap, setNeedsTap] = useState(false);
  const autoplayed = useRef(false);
  usePlayerHotkeys();

  const onPlay = useCallback(
    (station: Station) => {
      setNeedsTap(false);
      if (player.station?.id === station.id && player.status !== 'error')
        void send({ type: 'toggle' });
      else
        void send({
          type: settings.playOnSelect ? 'play' : 'load',
          station,
          queue: list.shown,
          context: feed.context,
        });
    },
    [send, settings.playOnSelect, list.shown, feed.context, player.station?.id, player.status],
  );

  // Start a station as soon as the first list is in, unless something is already playing.
  useEffect(() => {
    if (autoplayed.current || !settings.autoplayDesktop || feed.status !== 'ready' || !browse.ready)
      return;
    autoplayed.current = true;
    if (player.status === 'playing' || player.status === 'loading') return;
    const first = feed.stations.find(
      (s) => platform.playsHttp || s.streamUrl.startsWith('https://'),
    );
    if (!first) return;
    void send({ type: 'play', station: first, queue: feed.stations, context: feed.context });
    const t = setTimeout(() => {
      if (
        platform.player.getState().status !== 'playing' &&
        platform.player.getState().status !== 'loading'
      )
        setNeedsTap(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [
    feed.status,
    feed.stations,
    feed.context,
    browse.ready,
    settings.autoplayDesktop,
    player.status,
    send,
    platform,
  ]);

  useEffect(() => {
    document.title =
      player.station && player.status === 'playing'
        ? `▶ ${player.station.name} · Tajdîn`
        : 'Tajdîn · Internet radio';
  }, [player.station, player.status]);

  const title = viewLabel(browse.view, library);

  return (
    <div className="bg-background grid h-svh grid-rows-[auto_1fr_auto]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 md:h-16 md:flex-nowrap md:py-0">
        <div className="flex shrink-0 items-center gap-2.5 md:w-56">
          <RojMark className="h-6 w-auto" live={player.status === 'playing'} />
          <span className="text-lg font-semibold tracking-tight">Tajdîn</span>
        </div>
        <SearchBar browse={browse} className="order-last mx-auto w-full max-w-2xl md:order-none" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeMenu />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Settings"
            onClick={() => platform.openSettings?.('general')}
          >
            <SettingsIcon />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[256px_1fr]">
        <aside className="hidden min-h-0 border-r md:block">
          <Sidebar view={browse.view} onChange={browse.setView} />
        </aside>
        <main className="min-h-0 overflow-y-auto" id="main">
          {player.station && (
            <section aria-label="Now playing" className="relative overflow-hidden border-b">
              {player.station.favicon && (
                <img
                  src={player.station.favicon}
                  alt=""
                  aria-hidden
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 size-full scale-125 object-cover opacity-20 blur-3xl"
                />
              )}
              <div className="relative flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
                <StationArt
                  station={player.station}
                  className="size-16 rounded-xl text-xl shadow-xl sm:size-24 sm:rounded-2xl sm:text-2xl"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {player.status === 'playing'
                      ? 'Now playing'
                      : player.status === 'loading'
                        ? 'Connecting'
                        : 'Paused'}
                    {player.context &&
                      player.context.kind !== 'single' &&
                      ` · ${player.context.label}`}
                  </span>
                  <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl" dir="auto">
                    {player.station.name}
                  </h2>
                  <NowPlayingLine className="text-sm" />
                </div>
              </div>
            </section>
          )}
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <h2 className="hidden text-xl font-semibold tracking-tight md:block" dir="auto">
                {title}
              </h2>
              <ViewPicker view={browse.view} onChange={browse.setView} className="md:hidden" />
              {browse.view.kind === 'mix' ? (
                <ShuffleButton onClick={feed.reload} />
              ) : (
                <Button variant="ghost" size="icon-sm" aria-label="Reload" onClick={feed.reload}>
                  <RefreshCwIcon />
                </Button>
              )}
              {list.shown.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-auto"
                  onClick={() => list.shown[0] && onPlay(list.shown[0])}
                >
                  <PlayIcon data-icon="inline-start" />
                  Play all
                </Button>
              )}
            </div>
            {feed.status === 'ready' && feed.stations.length > 0 && (
              <ListToolbar
                list={list}
                className="max-w-2xl"
                count={{ shown: list.shown.length, total: feed.stations.length }}
              />
            )}
            <Grid
              feed={
                browse.ready ? { ...feed, stations: list.shown } : { ...feed, status: 'loading' }
              }
              onPlay={onPlay}
            />
          </div>
        </main>
      </div>

      <footer className="bg-card/80 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="px-4 py-2 md:px-6 md:py-3">
          <Player variant="full" className="hidden md:grid" />
          <Player className="md:hidden" />
        </div>
        <Footer className="border-t py-1.5" />
      </footer>

      {needsTap && player.station && player.status !== 'playing' && player.status !== 'loading' && (
        <div
          className="bg-background/70 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tap-title"
        >
          <div className="bg-card flex max-w-sm flex-col items-center gap-4 rounded-2xl border p-8 text-center shadow-2xl">
            <RojMark className="h-12 w-auto" />
            <h2 id="tap-title" className="text-lg font-semibold">
              Ready when you are
            </h2>
            <p className="text-muted-foreground text-sm">
              Your browser needs one click before it plays sound. Up first:{' '}
              <span dir="auto" className="text-foreground font-medium">
                {player.station.name}
              </span>
            </p>
            <Button
              size="lg"
              autoFocus
              className="rounded-full px-6"
              onClick={() => {
                setNeedsTap(false);
                void send({ type: 'resume' });
              }}
            >
              <PlayIcon data-icon="inline-start" className="fill-current" />
              Start listening
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
