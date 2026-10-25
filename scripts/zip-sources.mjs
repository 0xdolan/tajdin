#!/usr/bin/env node
// Builds tajdin-<version>-sources.zip from the committed tree (git archive), for store reviewers
// and anyone rebuilding a release. Paths marked `export-ignore` in .gitattributes are left out.
// Uncommitted changes are not included, so in CI this is exactly the tagged source.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const outDir = join(root, 'apps/extension/.output');
const out = join(outDir, `tajdin-${version}-sources.zip`);
mkdirSync(outDir, { recursive: true });
execFileSync('git', ['archive', '--format=zip', '-o', out, 'HEAD'], {
  cwd: root,
  stdio: 'inherit',
});
const files = execFileSync('unzip', ['-Z1', out], { encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && !f.endsWith('/'));
console.log(`✓ ${out.replace(`${root}/`, '')} (${files.length} files)`);
