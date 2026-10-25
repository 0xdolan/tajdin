#!/usr/bin/env node
// Renders every raster icon from the SVG sources in assets/brand/.
// Run after editing the logo: `pnpm icons`. Outputs are committed so builds don't need sharp.
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = (f) => join(root, 'assets/brand', f);

const targets = [
  // Extension: manifest icons and toolbar states (see apps/extension/src/lib/toolbar-icon.ts)
  ...[16, 32, 48, 96, 128].map((n) => [
    brand('tajdin-icon.svg'),
    `apps/extension/public/icon/${n}.png`,
    n,
  ]),
  ...['idle', 'paused', 'play-1', 'play-2'].flatMap((state) =>
    [16, 32].map((n) => [
      brand(`toolbar-${state}.svg`),
      `apps/extension/public/icon/toolbar-${state}-${n}.png`,
      n,
    ]),
  ),
  // Website: favicons and install icons
  [brand('tajdin-icon.svg'), 'apps/web/public/favicon-32.png', 32],
  [brand('tajdin-icon.svg'), 'apps/web/public/apple-touch-icon.png', 180],
  [brand('tajdin-icon.svg'), 'apps/web/public/icon-192.png', 192],
  [brand('tajdin-icon.svg'), 'apps/web/public/icon-512.png', 512],
  [brand('tajdin-icon.svg'), 'assets/brand/tajdin-icon-512.png', 512],
  // Store listings
  [brand('tajdin-icon.svg'), 'assets/store/icon-128.png', 128],
];

for (const [src, out, size] of targets) {
  const file = join(root, out);
  await mkdir(dirname(file), { recursive: true });
  await sharp(src, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`${out} (${size}px)`);
}
