#!/usr/bin/env node
// Loads the built Chrome extension in Chromium, drives it like a user, and saves screenshots
// for the README and store listings. Also a smoke test: it fails on page errors.
//
//   pnpm build:extension && pnpm screenshots            # extension + website shots
//   pnpm screenshots --only=extension --theme=dark
/* global chrome -- used inside page.evaluate(), which runs in the extension page */
import { chromium } from '@playwright/test';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    only: { type: 'string' },
    theme: { type: 'string', default: 'both' },
    out: { type: 'string', default: 'assets/screenshots' },
    web: { type: 'string', default: 'http://localhost:4319/tajdin/' },
    headed: { type: 'boolean', default: false },
  },
});

const root = resolve(import.meta.dirname, '..');
const extensionPath = join(root, 'apps/extension/.output/chrome-mv3');
const outDir = resolve(root, args.out);
const themes = args.theme === 'both' ? ['dark', 'light'] : [args.theme];
const errors = [];

/** Example library so the screenshots show real features, not empty states. */
const SEED_LIBRARY = {
  favourites: ['ku:5', 'ku:2', 'ku:7', 'soma:groovesalad'],
  playlists: [
    {
      id: 'pl-morning',
      name: 'Morning drive',
      description: 'News first, then music',
      colour: 'amber',
      stationIds: ['ku:5', 'ku:4', 'soma:groovesalad', 'ku:2'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
    {
      id: 'pl-focus',
      name: 'Deep focus',
      colour: 'violet',
      stationIds: ['soma:dronezone', 'soma:groovesalad'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  ],
  groups: [
    {
      kind: 'language',
      id: 'gr-ku',
      name: 'Kurdish radio',
      colour: 'green',
      language: 'ku',
      stationIds: ['ku:1'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
    {
      kind: 'manual',
      id: 'gr-news',
      name: 'News',
      colour: 'sky',
      stationIds: ['ku:5', 'ku:4'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  ],
  customStations: [
    {
      id: 'custom:demo',
      source: 'custom',
      name: 'My home stream',
      streamUrl: 'https://ice2.somafm.com/groovesalad-128-mp3',
      languages: [],
      tags: ['ambient'],
    },
  ],
  stationCache: {},
};

function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      !/Failed to load resource|net::ERR|favicon|status of 4\d\d|status of 5\d\d/i.test(m.text())
    ) {
      errors.push(`${label} console: ${m.text()}`);
    }
  });
}

async function shoot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  console.log(`  ✓ ${name}.png`);
}

async function extensionShots() {
  const userDataDir = join(tmpdir(), `tajdin-shots-${Date.now()}`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: !args.headed,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    worker.on('console', (m) => m.type() === 'error' && errors.push(`background: ${m.text()}`));
    const id = new URL(worker.url()).host;
    const url = (p) => `chrome-extension://${id}/${p}`;

    for (const theme of themes) {
      console.log(`Extension (${theme})`);
      const setup = await context.newPage();
      await setup.goto(url('options.html'));
      await setup.evaluate(
        async ({ library, theme }) => {
          await chrome.storage.session.clear();
          await chrome.storage.local.set({
            'tajdin.v2.schema': 2,
            'tajdin.v2.library': library,
            'tajdin.v2.settings': {
              theme,
              showNowPlaying: true,
              welcomeDismissed: theme === 'dark',
            },
          });
        },
        { library: SEED_LIBRARY, theme },
      );
      await setup.close();

      const popup = await context.newPage();
      watch(popup, 'popup');
      await popup.setViewportSize({ width: 400, height: 600 });
      await popup.goto(url('popup.html'));
      await popup.getByRole('listitem').first().waitFor({ timeout: 20000 });
      await shoot(popup, `popup-mix-${theme}`);

      // Play the first station and wait for the player to report it.
      await popup.getByRole('listitem').first().getByRole('button').first().click();
      await popup
        .getByRole('button', { name: /^Pause/ })
        .first()
        .waitFor({ timeout: 25000 })
        .catch(() => errors.push('popup: playback did not start within 25 s'));
      await popup.waitForTimeout(2500);
      await shoot(popup, `popup-playing-${theme}`);

      await popup.getByRole('button', { name: 'Search' }).click();
      await popup.getByRole('searchbox').fill('rudaw');
      await popup.waitForTimeout(1500);
      await shoot(popup, `popup-search-${theme}`);
      await popup.close();

      const settings = await context.newPage();
      watch(settings, 'settings');
      await settings.setViewportSize({ width: 1280, height: 800 });
      for (const tab of ['general', 'playlists', 'groups', 'backup']) {
        await settings.goto(url(`options.html#${tab}`));
        await settings.waitForTimeout(1500);
        await shoot(settings, `settings-${tab}-${theme}`);
      }
      await settings.close();

      const desktop = await context.newPage();
      watch(desktop, 'desktop');
      await desktop.setViewportSize({ width: 1280, height: 800 });
      await desktop.goto(url('desktop.html'));
      await desktop
        .getByRole('button', { name: /^Play / })
        .first()
        .waitFor({ timeout: 20000 });
      await desktop.waitForTimeout(4000);
      await shoot(desktop, `desktop-${theme}`);
      await desktop.close();

      // Stop playback between themes.
      const stopper = await context.newPage();
      await stopper.goto(url('options.html'));
      await stopper.evaluate(() =>
        chrome.runtime.sendMessage({ type: 'player:command', command: { type: 'pause' } }),
      );
      await stopper.close();
    }
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

async function webShots() {
  const browser = await chromium.launch({
    channel: 'chromium',
    headless: !args.headed,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  try {
    for (const theme of themes) {
      console.log(`Website (${theme})`);
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        colorScheme: theme,
      });
      watch(page, 'web');
      await page.goto(args.web);
      await page
        .getByRole('button', { name: /^Play / })
        .first()
        .waitFor({ timeout: 20000 });
      await page.waitForTimeout(4000);
      await shoot(page, `web-${theme}`);
      const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 },
        colorScheme: theme,
        isMobile: true,
        hasTouch: true,
      });
      watch(mobile, 'web-mobile');
      await mobile.goto(args.web);
      await mobile.waitForTimeout(4000);
      await shoot(mobile, `web-mobile-${theme}`);
      await page.close();
      await mobile.close();
    }
  } finally {
    await browser.close();
  }
}

await mkdir(outDir, { recursive: true });
if (args.only !== 'web') await extensionShots();
if (args.only !== 'extension') await webShots();

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${[...new Set(errors)].join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('\nNo page errors.');
}
