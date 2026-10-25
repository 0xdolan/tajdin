#!/usr/bin/env node
// Gitflow release helper (see docs/releasing.md).
//   pnpm release:start minor    → release/x.y.z from develop, bumped version and changelog
//   pnpm release:finish         → merge into main, tag vX.Y.Z, merge back into develop
// Nothing is pushed; the script prints the push command so you stay in control.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
const version = () => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const [action, bump = 'minor'] = process.argv.slice(2);
if (read('git', ['status', '--porcelain'])) {
  console.error('Commit or stash your changes first.');
  process.exit(1);
}

if (action === 'start') {
  run('git', ['switch', 'develop']);
  run('node', ['scripts/bump-version.mjs', bump]);
  const v = version();
  run('git', ['stash', 'push', '--quiet', '--', '.']);
  run('git', ['switch', '-c', `release/${v}`]);
  run('git', ['stash', 'pop', '--quiet']);
  run('pnpm', ['exec', 'git-cliff', '--unreleased', '--tag', `v${v}`, '--prepend', 'CHANGELOG.md']);
  run('git', ['commit', '-am', `chore(release): v${v}`]);
  console.log(
    `\nOn release/${v}. Polish the new CHANGELOG.md section (it becomes the release notes), test, then: pnpm release:finish`,
  );
} else if (action === 'finish') {
  const branch = read('git', ['branch', '--show-current']);
  if (!branch.startsWith('release/') && !branch.startsWith('hotfix/')) {
    console.error('Run this on a release/* or hotfix/* branch.');
    process.exit(1);
  }
  const v = version();
  run('pnpm', ['check']);
  run('git', ['switch', 'main']);
  run('git', ['merge', '--no-ff', branch, '-m', `Merge ${branch}`]);
  run('git', ['tag', '-a', `v${v}`, '-m', `Tajdîn v${v}`]);
  run('git', ['switch', 'develop']);
  run('git', ['merge', '--no-ff', branch, '-m', `Merge ${branch} into develop`]);
  run('git', ['branch', '-d', branch]);
  console.log(`\nTagged v${v}. Publish with:\n  git push origin main develop v${v}`);
} else {
  console.error('Usage: pnpm release:start [major|minor|patch|x.y.z] | pnpm release:finish');
  process.exit(1);
}
