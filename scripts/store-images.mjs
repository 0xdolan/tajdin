#!/usr/bin/env node
// Composes store and social images from the screenshots (run `pnpm screenshots` first):
//   assets/store/screenshot-*.png   1280×800  Chrome Web Store / AMO screenshots
//   assets/store/promo-440x280.png  small promo tile
//   assets/store/marquee-1400x560.png
//   apps/web/public/og-image.png    1200×630 social preview
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const shots = join(root, 'assets/screenshots');
const store = join(root, 'assets/store');
await mkdir(store, { recursive: true });

const sunSvg = await readFile(join(root, 'assets/brand/tajdin-mark-light.svg'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function backdrop(w, h) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2668"/><stop offset="1" stop-color="#0d0d20"/></linearGradient>
      <radialGradient id="sun" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="#f7c548" stop-opacity="0.28"/><stop offset="1" stop-color="#f7c548" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#sun)"/>
  </svg>`);
}

function text(w, h, lines) {
  const tspans = lines
    .map(
      ({ t, size, weight = 700, fill = '#f8fafc', dy }) =>
        `<text x="0" y="${dy}" font-family="Inter, 'DejaVu Sans', sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(t)}</text>`,
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${tspans}</svg>`,
  );
}

const mark = (width) => sharp(Buffer.from(sunSvg)).resize({ width }).png().toBuffer();
const rounded = async (file, width, radius = 18) => {
  const img = await sharp(file).resize({ width }).png().toBuffer();
  const { height } = await sharp(img).metadata();
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`,
  );
  return {
    input: await sharp(img)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer(),
    height,
  };
};

async function popupSlide(out, popupFile, title, subtitle) {
  const popup = await rounded(popupFile, 400, 16);
  await sharp(backdrop(1280, 800))
    .composite([
      { input: await mark(120), left: 96, top: 210 },
      {
        input: text(640, 260, [
          { t: title, size: 54, dy: 60 },
          { t: subtitle, size: 26, weight: 400, fill: '#c9c8e3', dy: 120 },
          { t: 'Tajdîn · always by your side', size: 22, weight: 600, fill: '#f7c548', dy: 190 },
        ]),
        left: 96,
        top: 318,
      },
      { input: popup.input, left: 1280 - 400 - 120, top: Math.round((800 - popup.height) / 2) },
    ])
    .png()
    .toFile(out);
  console.log(`✓ ${out.replace(root + '/', '')}`);
}

async function fit(out, file) {
  await sharp(file).resize(1280, 800, { fit: 'cover', position: 'top' }).png().toFile(out);
  console.log(`✓ ${out.replace(root + '/', '')}`);
}

await popupSlide(
  join(store, 'screenshot-1-popup.png'),
  join(shots, 'popup-playing-dark.png'),
  'Radio in your toolbar',
  'Kurdish stations and 50,000+ more.',
);
await fit(join(store, 'screenshot-2-desktop.png'), join(shots, 'desktop-dark.png'));
await popupSlide(
  join(store, 'screenshot-3-light.png'),
  join(shots, 'popup-mix-light.png'),
  'A new mix every time',
  'Or open on your favourites, a playlist or a language.',
);
await fit(join(store, 'screenshot-4-playlists.png'), join(shots, 'settings-playlists-dark.png'));
await fit(join(store, 'screenshot-5-backup.png'), join(shots, 'settings-backup-light.png'));

async function banner(out, w, h, { markW, title, size, sub, subSize, shot }) {
  const layers = [
    { input: await mark(markW), left: Math.round(w * 0.06), top: Math.round(h * 0.18) },
    {
      input: text(Math.round(w * 0.6), h, [
        { t: title, size, dy: Math.round(h * 0.18) + Math.round(markW * 0.62) + size + 10 },
        {
          t: sub,
          size: subSize,
          weight: 400,
          fill: '#c9c8e3',
          dy: Math.round(h * 0.18) + Math.round(markW * 0.62) + size + subSize + 26,
        },
      ]),
      left: Math.round(w * 0.06),
      top: 0,
    },
  ];
  if (shot) {
    const s = await rounded(shot, Math.round((h * 0.82 * 400) / 600), 14);
    layers.push({
      input: s.input,
      left: w - Math.round((h * 0.82 * 400) / 600) - Math.round(w * 0.06),
      top: Math.round(h * 0.09),
    });
  }
  await sharp(backdrop(w, h)).composite(layers).png().toFile(out);
  console.log(`✓ ${out.replace(root + '/', '')}`);
}

await banner(join(store, 'promo-440x280.png'), 440, 280, {
  markW: 110,
  title: 'Tajdîn',
  size: 40,
  sub: 'Internet radio, always by your side',
  subSize: 15,
});
await banner(join(store, 'marquee-1400x560.png'), 1400, 560, {
  markW: 190,
  title: 'Tajdîn',
  size: 84,
  sub: 'Kurdish radio and 50,000+ stations worldwide',
  subSize: 30,
  shot: join(shots, 'popup-playing-dark.png'),
});
await banner(join(root, 'apps/web/public/og-image.png'), 1200, 630, {
  markW: 180,
  title: 'Tajdîn',
  size: 80,
  sub: 'Internet radio, always by your side',
  subSize: 30,
  shot: join(shots, 'popup-playing-dark.png'),
});
