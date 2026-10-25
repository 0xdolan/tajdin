import { useEffect, useState } from 'react';
import {
  DatabaseBackupIcon,
  HeartIcon,
  InfoIcon,
  KeyboardIcon,
  ListMusicIcon,
  MonitorIcon,
  PlayCircleIcon,
  RadioTowerIcon,
  Settings2Icon,
  ShapesIcon,
} from 'lucide-react';
import { Button } from '@tajdin/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tajdin/ui/components/tabs';
import { RojMark } from '../../components/brand';
import { Footer } from '../../components/footer';
import { NowPlayingLine, Player } from '../../components/player';
import { usePlatform, type SettingsTab } from '../../platform';
import { ThemeMenu } from '../../shell';
import { AboutSettings } from './about';
import { BackupSettings } from './backup';
import { CollectionsSettings } from './collections';
import { FavouritesSettings } from './favourites';
import { GeneralSettings } from './general';
import { PlaybackSettings } from './playback';
import { ShortcutsSettings } from './shortcuts';
import { StationsSettings } from './stations';

const TABS: {
  id: SettingsTab;
  label: string;
  icon: typeof InfoIcon;
  group: 'Settings' | 'Options';
}[] = [
  { id: 'general', label: 'General', icon: Settings2Icon, group: 'Settings' },
  { id: 'playback', label: 'Playback', icon: PlayCircleIcon, group: 'Settings' },
  { id: 'shortcuts', label: 'Shortcuts', icon: KeyboardIcon, group: 'Settings' },
  { id: 'favourites', label: 'Favourites', icon: HeartIcon, group: 'Options' },
  { id: 'stations', label: 'My stations', icon: RadioTowerIcon, group: 'Options' },
  { id: 'playlists', label: 'Playlists', icon: ListMusicIcon, group: 'Options' },
  { id: 'groups', label: 'Groups', icon: ShapesIcon, group: 'Options' },
  { id: 'backup', label: 'Backup', icon: DatabaseBackupIcon, group: 'Options' },
  { id: 'about', label: 'About', icon: InfoIcon, group: 'Options' },
];

const isTab = (v: string): v is SettingsTab => TABS.some((t) => t.id === v);

/** The extension uses `#playlists`; the website nests settings under its own route: `#settings/playlists`. */
function tabFromHash(prefix: string): SettingsTab {
  const hash = location.hash.slice(1);
  const tab = hash.startsWith(prefix) ? hash.slice(prefix.length) : '';
  return isTab(tab) ? tab : 'general';
}

/** Settings and Options in one page: preferences on top, library management below. */
export function SettingsApp({ hashPrefix = '' }: { hashPrefix?: string }) {
  const { openDesktop, kind } = usePlatform();
  const [tab, setTab] = useState<SettingsTab>(() => tabFromHash(hashPrefix));

  useEffect(() => {
    const onHash = () => setTab(tabFromHash(hashPrefix));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [hashPrefix]);

  const select = (value: SettingsTab) => {
    setTab(value);
    history.replaceState(null, '', `#${hashPrefix}${value}`);
  };

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <RojMark className="h-5 w-auto" />
          <span className="font-semibold tracking-tight">Tajdîn</span>
          <span className="text-muted-foreground">/ {TABS.find((t) => t.id === tab)?.group}</span>
          <div className="ml-auto flex items-center gap-1">
            {openDesktop && (
              <Button variant="ghost" size="sm" onClick={openDesktop}>
                <MonitorIcon data-icon="inline-start" />
                Desktop view
              </Button>
            )}
            <ThemeMenu />
          </div>
        </div>
      </header>

      <Tabs
        orientation="vertical"
        value={tab}
        onValueChange={(v) => select(v as SettingsTab)}
        className="mx-auto w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row"
      >
        <TabsList
          variant="line"
          className="w-full shrink-0 flex-row flex-wrap items-stretch md:sticky md:top-20 md:w-52 md:flex-col md:self-start"
        >
          {(['Settings', 'Options'] as const).map((group) => (
            <div key={group} className="contents md:flex md:flex-col md:gap-0.5">
              <span className="text-muted-foreground hidden px-2 pt-3 pb-1 text-xs font-medium md:block">
                {group}
              </span>
              {TABS.filter((t) => t.group === group).map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="justify-start gap-2">
                  <Icon />
                  {label}
                </TabsTrigger>
              ))}
            </div>
          ))}
        </TabsList>
        <div className="min-w-0 flex-1 pb-36">
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="playback">
            <PlaybackSettings />
          </TabsContent>
          <TabsContent value="shortcuts">
            <ShortcutsSettings />
          </TabsContent>
          <TabsContent value="favourites">
            <FavouritesSettings />
          </TabsContent>
          <TabsContent value="stations">
            <StationsSettings />
          </TabsContent>
          <TabsContent value="playlists">
            <CollectionsSettings kind="playlist" />
          </TabsContent>
          <TabsContent value="groups">
            <CollectionsSettings kind="group" />
          </TabsContent>
          <TabsContent value="backup">
            <BackupSettings />
          </TabsContent>
          <TabsContent value="about">
            <AboutSettings />
          </TabsContent>
        </div>
      </Tabs>

      <div className="bg-card/90 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-6 py-3">
          <NowPlayingLine />
          <Player variant="full" />
        </div>
        {kind === 'extension' && <Footer className="border-t py-1.5" />}
      </div>
    </div>
  );
}
