#!/usr/bin/env node
// Prints the CHANGELOG.md section for a version (default: package.json version), for the
// GitHub Release body. The changelog is the single, human-reviewed source of release notes.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const version =
  process.argv[2] ?? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
// Plain string matching (no regex built from input): the heading is "## [x.y.z](…)" or "## x.y.z".
const lines = changelog.split('\n');
const headingAt = lines.findIndex(
  (line) => line.startsWith(`## [${version}]`) || line.trim() === `## ${version}`,
);
const start =
  headingAt < 0 ? -1 : lines.slice(0, headingAt).join('\n').length + (headingAt > 0 ? 1 : 0);
if (start < 0) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
const rest = changelog.slice(start);
const end = rest.slice(3).search(/^## /m);
const section = (end < 0 ? rest : rest.slice(0, end + 3)).split('\n').slice(1).join('\n').trim();
console.log(
  `${section}\n\n**Install:** [Chrome Web Store](https://chromewebstore.google.com/detail/igldoeednndfkhmigohfblmlppmphock) · [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tajdin/) · or download a zip below and follow [installing from a zip](https://github.com/0xdolan/tajdin#install-from-a-release-zip).`,
);
