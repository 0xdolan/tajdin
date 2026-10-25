# Contributing to Tajdîn

Thanks for helping! Bug reports, station suggestions, translations of ideas, design feedback and
code are all welcome.

## Quick start

```bash
corepack enable
pnpm install
pnpm dev            # Chrome with hot reload (pnpm dev:firefox / pnpm dev:web)
pnpm check          # what CI checks first: lint, formatting, types, unit tests
```

More detail is in [docs/development.md](docs/development.md) and
[docs/architecture.md](docs/architecture.md).

## Workflow (gitflow)

1. Branch from `develop`: `feature/<short-name>` (or `fix/<short-name>`).
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/). A commit hook checks
   this:
   - `feat(popup): add sleep timer`
   - `fix(core): skip stations without a stream URL`
   - `feat(stations): add Dengê Welat`
   - `docs: explain language groups`
   - Others: `refactor`, `perf`, `test`, `chore`, `ci`, `build`. Add `!` or a `BREAKING CHANGE:`
     footer for breaking changes.
3. Open a pull request into **`develop`**. CI must pass.
4. Maintainers cut releases from `develop` (see [docs/releasing.md](docs/releasing.md)).

## Rules of the house

- **People are the contributors.** Don't let AI coding tools add themselves to commits through
  `Co-authored-by:` or `Made-with:` lines. The commit hook strips these lines and CI rejects
  commits that still have them (`scripts/attribution.mjs`).
- **Privacy first.** No analytics, tracking, remote code or new third-party services without
  discussion. Any new network destination must go in the privacy policy.
- **Minimal permissions.** Adding a browser permission needs a strong reason, explained in the PR.
- **Validate at the edges.** Anything from storage, imports or APIs goes through a Zod schema.
  Only `http(s)` URLs are accepted.
- **Shared code stays shared.** Logic goes in `packages/core` (no React, no `chrome.*`) and UI in
  `packages/ui`; browser specifics go in `apps/extension/src/lib`.
- **Use the design system.** Use shadcn/ui components and semantic tokens (`bg-primary`,
  `text-muted-foreground`, `text-brand`, `text-live`), not raw colours. Use `gap-*` instead of
  `space-*`. Every icon button needs an `aria-label`.
- **Accessible by default.** Everything must work by keyboard, respect reduced motion, and use
  `dir="auto"` on station names.
- **Tests.** Fixes in `packages/core` come with a unit test. Run `pnpm screenshots` for UI changes
  you can't unit-test.
- **Data compatibility.** Changing stored data or the backup format needs a migration and a test
  (see `storage/legacy.ts` and `backup/backup.ts`).

## Reporting bugs

Use the [bug report form](https://github.com/0xdolan/tajdin/issues/new?template=bug.yml). Include
your browser and version, Tajdîn's version (shown in the footer) and the station if relevant.
Security issues: see [SECURITY.md](SECURITY.md); please don't open public issues for them.
