import { createContext, useContext, type ReactNode } from 'react';
import type { Catalog, PlayerClient, Repository, StorageArea } from '@tajdin/core';

export type Surface = 'popup' | 'settings' | 'desktop';
export type SettingsTab =
  'general' | 'playback' | 'stations' | 'playlists' | 'groups' | 'backup' | 'shortcuts' | 'about';

export interface ShortcutInfo {
  name: string;
  description: string;
  shortcut: string;
}

/**
 * What a surface needs from its host. The extension and the website each provide one;
 * everything under `@tajdin/ui/app` only talks to this.
 */
export interface Platform {
  kind: 'extension' | 'web';
  surface: Surface;
  version: string;
  repository: Repository;
  /** Per-browser-session storage (popup UI state, form drafts). */
  session: StorageArea;
  catalog: Catalog;
  player: PlayerClient;
  /** http:// streams can be played (false on the https website). */
  playsHttp: boolean;
  openSettings?: (tab?: SettingsTab) => void;
  openDesktop?: () => void;
  /** Opens the browser's own keyboard-shortcut editor. */
  openShortcutEditor?: () => void;
  getShortcuts?: () => Promise<ShortcutInfo[]>;
  /** Firefox and Chrome have different store pages; the web build links both. */
  storeLinks: { label: string; href: string }[];
}

export const LINKS = {
  author: 'https://github.com/0xdolan',
  source: 'https://github.com/0xdolan/tajdin',
  docs: 'https://0xdolan.github.io/tajdin/docs/',
  site: 'https://0xdolan.github.io/tajdin/',
  issues: 'https://github.com/0xdolan/tajdin/issues',
  privacy: 'https://github.com/0xdolan/tajdin/blob/main/docs/privacy-policy.md',
  changelog: 'https://github.com/0xdolan/tajdin/blob/main/CHANGELOG.md',
  radioBrowser: 'https://www.radio-browser.info/',
  somafm: 'https://somafm.com/',
  lautfm: 'https://laut.fm/',
} as const;

/** Store listings. The Chrome link points at the listing once its ID is set (see docs/releasing.md). */
export const STORE_LINKS = [
  {
    browser: 'chrome',
    label: 'Chrome Web Store',
    href: 'https://chromewebstore.google.com/search/Tajd%C3%AEn',
  },
  {
    browser: 'firefox',
    label: 'Firefox Add-ons',
    href: 'https://addons.mozilla.org/firefox/addon/tajdin/',
  },
] as const;

const PlatformContext = createContext<Platform | null>(null);

export function PlatformProvider({
  platform,
  children,
}: {
  platform: Platform;
  children: ReactNode;
}) {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) throw new Error('usePlatform must be used inside <PlatformProvider>');
  return platform;
}
