#!/usr/bin/env node
// Gitflow release helper (see docs/releasing.md).
//   pnpm release:start minor    → release/x.y.z from develop, bumped version and changelog
//   pnpm release:finish         → release PR into main, tag vX.Y.Z, back-merge PR into develop
// Every change reaches main and develop through a pull request that passed CI.
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
  // Everything goes through pull requests, so main and develop are never pushed to directly
  // (and GitHub never shows a stray "had recent pushes" banner for them).
  const branch = read('git', ['branch', '--show-current']);
  if (!branch.startsWith('release/') && !branch.startsWith('hotfix/')) {
    console.error('Run this on a release/* or hotfix/* branch.');
    process.exit(1);
  }
  const v = version();
  const notes = read('node', ['scripts/release-notes.mjs', v]);
  run('pnpm', ['check']);
  run('git', ['push', '-u', 'origin', branch]);

  // 1. Release PR into main, merged once CI passes.
  run('gh', [
    'pr',
    'create',
    '--base',
    'main',
    '--head',
    branch,
    '--title',
    `chore(release): v${v}`,
    '--body',
    notes,
  ]);
  run('gh', ['pr', 'checks', branch, '--watch', '--fail-fast']);
  run('gh', ['pr', 'merge', branch, '--merge', '--subject', `Merge ${branch}: release v${v}`]);

  // 2. Tag the merge commit on main; the tag publishes the GitHub Release and submits to the stores.
  run('git', ['fetch', 'origin']);
  run('git', ['tag', '-a', `v${v}`, '-m', `Tajdîn v${v}`, 'origin/main']);
  run('git', ['push', 'origin', `v${v}`]);

  // 3. Back-merge main into develop through a PR as well.
  const backMerge = `chore/back-merge-v${v}`;
  run('git', ['switch', '-c', backMerge, 'origin/main']);
  run('git', ['push', '-u', 'origin', backMerge]);
  run('gh', [
    'pr',
    'create',
    '--base',
    'develop',
    '--head',
    backMerge,
    '--title',
    `chore: merge v${v} back into develop`,
    '--body',
    `Gitflow back-merge after releasing v${v}.`,
  ]);
  run('gh', ['pr', 'checks', backMerge, '--watch', '--fail-fast']);
  run('gh', ['pr', 'merge', backMerge, '--merge', '--delete-branch']);

  // 4. Tidy up.
  run('git', ['switch', 'develop']);
  run('git', ['pull', '--ff-only']);
  run('git', ['push', 'origin', '--delete', branch]);
  run('git', ['branch', '-D', branch]);
  console.log(
    `\nReleased v${v}. Watch the Release workflow: gh run watch $(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')`,
  );
} else {
  console.error('Usage: pnpm release:start [major|minor|patch|x.y.z] | pnpm release:finish');
  process.exit(1);
}
