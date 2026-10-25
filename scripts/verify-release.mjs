#!/usr/bin/env node
// Checks the release zips before they're published: they exist, their manifests carry the
// version from package.json, the Firefox one has its add-on ID, and nothing unexpected leaks in.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const out = join(root, 'apps/extension/.output');
const problems = [];

const list = (zip) =>
  execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter(Boolean);
const manifest = (zip) =>
  JSON.parse(execFileSync('unzip', ['-p', zip, 'manifest.json'], { encoding: 'utf8' }));

for (const pkg of ['packages/core', 'packages/ui', 'apps/extension', 'apps/web']) {
  const v = JSON.parse(readFileSync(join(root, pkg, 'package.json'), 'utf8')).version;
  if (v !== version) problems.push(`${pkg}/package.json is ${v}, expected ${version}`);
}

for (const browser of ['chrome', 'firefox']) {
  const zip = join(out, `tajdin-${version}-${browser}.zip`);
  if (!existsSync(zip)) {
    problems.push(`missing ${zip}`);
    continue;
  }
  const m = manifest(zip);
  if (m.version !== version) problems.push(`${browser} manifest version ${m.version} ≠ ${version}`);
  const files = list(zip);
  for (const required of ['popup.html', 'options.html', 'desktop.html', 'icon/128.png']) {
    if (!files.includes(required)) problems.push(`${browser} zip lacks ${required}`);
  }
  if (files.some((f) => f.endsWith('.map'))) problems.push(`${browser} zip contains source maps`);
  if (browser === 'chrome' && !files.includes('offscreen.html'))
    problems.push('chrome zip lacks offscreen.html');
  if (
    browser === 'firefox' &&
    m.browser_specific_settings?.gecko?.id !== 'tajdin@0xdolan.github.io'
  ) {
    problems.push('firefox manifest lacks the gecko add-on ID');
  }
  console.log(`✓ ${browser}: v${m.version}, ${files.length} files`);
}

const sources = join(out, `tajdin-${version}-sources.zip`);
if (!existsSync(sources)) problems.push(`missing ${sources} (Firefox reviewers need it)`);
else {
  const files = list(sources);
  if (files.some((f) => f.includes('node_modules/') || f.startsWith('.env')))
    problems.push('sources zip contains node_modules or .env');
  console.log(`✓ sources: ${files.length} files`);
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nRelease v${version} looks good.`);
