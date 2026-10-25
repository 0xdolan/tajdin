#!/usr/bin/env node
// Sets one version across the workspace. The extension manifest takes its version from
// apps/extension/package.json, so this is the only place versions change.
//   pnpm version:bump 0.3.0     |   pnpm version:bump minor
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const files = [
  'package.json',
  'packages/core/package.json',
  'packages/ui/package.json',
  'packages/tsconfig/package.json',
  'apps/extension/package.json',
  'apps/web/package.json',
];
const current = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const arg = process.argv[2];

function next(kind) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  if (kind === 'patch') return `${major}.${minor}.${patch + 1}`;
  return kind;
}

const version = next(arg);
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: pnpm version:bump <major|minor|patch|x.y.z>');
  process.exit(1);
}
for (const file of files) {
  const path = join(root, file);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  json.version = version;
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`${current} → ${version}`);
