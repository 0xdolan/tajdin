#!/usr/bin/env node
// Keeps AI coding tools (Cursor's "Cursor Agent", etc.) from being credited as contributors.
//
//   node scripts/attribution.mjs strip <commit-msg-file>   Remove tool trailers (used by the commit-msg hook)
//   node scripts/attribution.mjs check [rev-range]         Fail if any commit credits a tool (used in CI)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

/** Trailers and identities that would make a tool show up as a GitHub contributor. */
const TRAILER = /^(co-authored-by:.*(cursor|cursoragent)|made-with:\s*cursor).*$/gim;
const IDENTITY = /cursoragent|cursor agent|@cursor\.(com|sh)/i;

const [mode, arg] = process.argv.slice(2);

if (mode === 'strip') {
  const message = readFileSync(arg, 'utf8');
  const cleaned =
    message
      .replace(TRAILER, '')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n';
  if (cleaned !== message) writeFileSync(arg, cleaned);
} else if (mode === 'check') {
  const range = arg ?? 'HEAD';
  const log = execFileSync(
    'git',
    ['log', '--format=%H%x00%an <%ae>%x00%cn <%ce>%x00%B%x1e', range],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const offenders = log
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [sha, author, committer, body] = entry.split('\x00');
      const hits = [];
      if (IDENTITY.test(author ?? '')) hits.push(`author ${author}`);
      if (IDENTITY.test(committer ?? '')) hits.push(`committer ${committer}`);
      for (const line of (body ?? '').match(TRAILER) ?? []) hits.push(line.trim());
      return hits.map((hit) => `${sha?.slice(0, 7)}  ${hit}`);
    });
  if (offenders.length) {
    console.error(
      `✗ ${offenders.length} commit(s) credit an AI tool as a contributor:\n  ${offenders.join('\n  ')}`,
    );
    console.error('Remove the trailer (git commit --amend / rebase) and push again.');
    process.exit(1);
  }
  console.log(`✓ No tool attribution in ${range}.`);
} else {
  console.error('Usage: attribution.mjs strip <file> | check [rev-range]');
  process.exit(1);
}
