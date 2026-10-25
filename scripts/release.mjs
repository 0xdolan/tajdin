#!/usr/bin/env node
// Release helper (see docs/releasing.md). main is the only working branch.
//   pnpm release:start minor    → release/x.y.z from main, bumped version and changelog
//   pnpm release:finish         → release PR into main, merged when CI passes, tagged vX.Y.Z
// The tag publishes everything; the Sync develop workflow then mirrors main into develop.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
/** Waits until GitHub has registered the PR's checks, then watches them; throws if any fail. */
function waitForChecks(branch) {
  for (let i = 0; i < 40; i++) {
    try {
      if (read('gh', ['pr', 'checks', branch]).includes('\t')) break;
    } catch {
      /* "no checks reported" until CI has started */
    }
    execFileSync('sleep', ['5']);
  }
  run('gh', ['pr', 'checks', branch, '--watch', '--fail-fast', '--interval', '15']);
}

const version = () => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const [action, bump = 'minor'] = process.argv.slice(2);
if (read('git', ['status', '--porcelain'])) {
  console.error('Commit or stash your changes first.');
  process.exit(1);
}

if (action === 'start') {
  run('git', ['switch', 'main']);
  run('git', ['pull', '--ff-only']);
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
  if (!branch.startsWith('release/')) {
    console.error('Run this on a release/* branch (pnpm release:start makes one).');
    process.exit(1);
  }
  const v = version();
  const notes = read('node', ['scripts/release-notes.mjs', v]);
  run('pnpm', ['check']);
  run('git', ['push', '-u', 'origin', branch]);

  // 1. Release PR into main, merged once CI passes; GitHub deletes the branch.
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
  waitForChecks(branch);
  run('gh', [
    'pr',
    'merge',
    branch,
    '--merge',
    '--delete-branch',
    '--subject',
    `Merge ${branch}: release v${v}`,
  ]);

  // 2. Tag the merge commit; the tag publishes the GitHub Release, the stores and the website.
  run('git', ['switch', 'main']);
  run('git', ['pull', '--ff-only']);
  run('git', ['tag', '-a', `v${v}`, '-m', `Tajdîn v${v}`, 'HEAD']);
  run('git', ['push', 'origin', `v${v}`]);
  try {
    run('git', ['branch', '-D', branch]);
  } catch {
    /* gh already deleted it */
  }
  console.log(
    `\nReleased v${v}. Watch the Release workflow: gh run watch $(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')`,
  );
} else {
  console.error('Usage: pnpm release:start [major|minor|patch|x.y.z] | pnpm release:finish');
  process.exit(1);
}
