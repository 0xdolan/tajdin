#!/usr/bin/env node
// Opens every page of the website on phone-sized screens and fails if anything sticks out
// sideways (horizontal scrolling) or a text field would make iOS Safari zoom in.
//
//   pnpm --filter @tajdin/web preview &
//   pnpm responsive                          # WebKit (Safari's engine), iPhone + small Android
//   pnpm responsive --browser=chromium --out=test-results/responsive
/* global window, document, getComputedStyle -- used inside page.evaluate() */
import { chromium, devices, webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    web: { type: 'string', default: 'http://localhost:4319/tajdin/' },
    browser: { type: 'string', default: 'webkit' },
    out: { type: 'string' },
  },
});

const PAGES = [
  '',
  '#settings/general',
  '#settings/playback',
  '#settings/shortcuts',
  '#settings/favourites',
  '#settings/stations',
  '#settings/playlists',
  '#settings/groups',
  '#settings/backup',
  '#settings/about',
  'docs/',
];
const DEVICES = ['iPhone SE', 'iPhone 15', 'Galaxy S9+'];

const engine = args.browser === 'chromium' ? chromium : webkit;
const browser = await engine.launch();
const outDir = args.out && resolve(args.out);
if (outDir) await mkdir(outDir, { recursive: true });
const failures = [];

for (const name of DEVICES) {
  // The device presets name a browser type, which newContext() doesn't accept.
  const device = { ...devices[name] };
  delete device.defaultBrowserType;
  const context = await browser.newContext({ ...device, colorScheme: 'dark' });
  for (const path of PAGES) {
    const page = await context.newPage();
    page.on('pageerror', (e) => failures.push(`${name} ${path || 'desktop'}: ${e.message}`));
    await page.goto(new URL(path, args.web).href);
    await page.waitForTimeout(1500);
    const report = await page.evaluate(() => {
      const width = window.innerWidth;
      const describe = (el) =>
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}` +
        (typeof el.className === 'string' && el.className
          ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
          : '');
      // Elements inside a horizontal scroller (tab strips, code blocks) may extend past the edge.
      const inScroller = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
        }
        return false;
      };
      const offenders = [...document.querySelectorAll('body *')].filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && (box.right > width + 1 || box.left < -1) && !inScroller(el);
      });
      // Report the innermost ones (the cause), not every container they stretch.
      const overflow = offenders
        .filter((el) => !offenders.some((other) => other !== el && el.contains(other)))
        .map((el) => {
          const box = el.getBoundingClientRect();
          return `${describe(el)} [${Math.round(box.left)}..${Math.round(box.right)}px]`;
        });
      const typed =
        'input:not([type]), input[type=text], input[type=search], input[type=url], input[type=email], input[type=number], input[type=password], input[type=tel], textarea, select';
      const zoomy = [...document.querySelectorAll(typed)]
        .filter((el) => el.getBoundingClientRect().width > 1 && !el.closest('[aria-hidden=true]'))
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map(describe);
      return {
        scroll:
          document.scrollingElement.scrollWidth > width && document.scrollingElement.scrollWidth,
        width,
        overflow: [...new Set(overflow)].slice(0, 5),
        zoomy: [...new Set(zoomy)].slice(0, 5),
      };
    });
    const label = `${name} ${path || 'desktop'}`;
    const problems = [
      ...(report.scroll ? [`page is ${report.scroll}px wide on a ${report.width}px screen`] : []),
      ...report.overflow.map((el) => `sticks out: ${el}`),
      ...report.zoomy.map((el) => `text field under 16px (iOS zooms): ${el}`),
    ];
    console.log(`${problems.length ? '✗' : '✓'} ${label}`);
    for (const p of problems) failures.push(`${label}: ${p}`);
    if (outDir) {
      const file = `${name}-${path || 'desktop'}`.replace(/[^\w.-]+/g, '-');
      await page.screenshot({ path: `${outDir}/${file}.png` });
    }
    await page.close();
  }
  await context.close();
}
await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nEvery page fits on every phone.');
