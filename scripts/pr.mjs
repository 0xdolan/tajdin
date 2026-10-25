#!/usr/bin/env node
// Ships the current branch: pushes it, opens a pull request into main and turns on auto-merge,
// so GitHub merges it (and deletes the branch) as soon as CI passes. Nothing is left waiting.
//   git switch -c fix/something main  …commit…  pnpm pr
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();

const branch = read('git', ['branch', '--show-current']);
if (branch === 'main' || branch === 'develop') {
  console.error(`You're on ${branch}. Start a branch first: git switch -c fix/<name> main`);
  process.exit(1);
}
if (read('git', ['status', '--porcelain'])) {
  console.error('Commit or stash your changes first.');
  process.exit(1);
}

run('git', ['push', '-u', 'origin', branch]);
let open = '';
try {
  open = read('gh', ['pr', 'view', branch, '--json', 'state', '--jq', '.state']);
} catch {
  /* no pull request yet */
}
if (open !== 'OPEN') run('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--fill']);
run('gh', ['pr', 'merge', branch, '--auto', '--merge', '--delete-branch']);
console.log('\nAuto-merge is on: GitHub merges this pull request once CI passes.');
