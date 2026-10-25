import { browser } from 'wxt/browser';
import { createCatalog, createRepository } from '@tajdin/core';
import { STORE_LINKS, type Platform, type SettingsTab, type Surface } from '@tajdin/ui/app';
import { createExtensionPlayerClient } from './player-client';
import { extensionArea } from './storage';

const isChrome = import.meta.env.CHROME;

/** Focuses an already-open extension page instead of opening a second copy (Chrome 116+). */
async function openPage(path: string, hash = '') {
  const url = browser.runtime.getURL(path as '/options.html');
  if (isChrome && chrome.runtime.getContexts) {
    const [existing] = await chrome.runtime.getContexts({
      contextTypes: ['TAB' as chrome.runtime.ContextType],
      documentUrls: [url, `${url}#*`],
    });
    if (existing?.tabId !== undefined && existing.tabId >= 0) {
      await browser.tabs.update(existing.tabId, { active: true, url: `${url}${hash}` });
      if (existing.windowId !== undefined)
        await browser.windows.update(existing.windowId, { focused: true });
      return;
    }
  }
  await browser.tabs.create({ url: `${url}${hash}` });
}

export function createExtensionPlatform(surface: Surface): Platform {
  const local = extensionArea('local');
  return {
    kind: 'extension',
    surface,
    version: browser.runtime.getManifest().version,
    repository: createRepository(local),
    session: extensionArea('session'),
    catalog: createCatalog(),
    player: createExtensionPlayerClient(),
    playsHttp: true,
    openSettings: (tab?: SettingsTab) => {
      void openPage('/options.html', tab ? `#${tab}` : '');
      if (surface === 'popup') window.close();
    },
    openDesktop: () => {
      void openPage('/desktop.html');
      if (surface === 'popup') window.close();
    },
    openShortcutEditor: () => {
      const commands = browser.commands as typeof browser.commands & {
        openShortcutSettings?: () => Promise<void>;
      };
      if (commands.openShortcutSettings) void commands.openShortcutSettings();
      else
        void browser.tabs.create({
          url: isChrome ? 'chrome://extensions/shortcuts' : 'about:addons',
        });
    },
    getShortcuts: async () =>
      (await browser.commands.getAll())
        .filter((c) => c.name && !c.name.startsWith('_'))
        .map((c) => ({
          name: c.name!,
          description: c.description ?? c.name!,
          shortcut: c.shortcut ?? '',
        })),
    storeLinks: STORE_LINKS.filter((l) => l.browser === (isChrome ? 'chrome' : 'firefox')).map(
      ({ label, href }) => ({ label, href }),
    ),
  };
}
