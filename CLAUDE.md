# Tajdîn: rules for AI assistants

A radio player shipped as a Chrome/Firefox extension and a GitHub Pages site, from one pnpm +
Turborepo monorepo. Read `docs/architecture.md` before larger changes.

## Layout

- `packages/core`: data model, station sources, storage, backup, player. **No React and no
  `chrome.*`/`browser.*` here.**
- `packages/ui`: shadcn/ui components (`src/components`, Base UI primitives, so use `render`
  instead of `asChild`) and the app (`src/app`: surfaces, hooks, dialogs).
- `apps/extension`: WXT. Background, popup, options, desktop, offscreen (Chrome only). Use
  `import.meta.env.CHROME`/`FIREFOX` for browser-specific code.
- `apps/web`: Vite site with an in-page player (`src/platform.ts`).

## Commands

`pnpm check` (lint, format, types, tests) · `pnpm build:extension` · `pnpm verify:release` ·
`pnpm screenshots` (needs `pnpm --filter @tajdin/web preview` for the web part) · `pnpm icons`.

## Rules

- Never add AI attribution to commits (no `Co-authored-by`/`Made-with` lines for tools); CI rejects
  them (`scripts/attribution.mjs`).
- Conventional Commits with lower-case subjects (enforced by commitlint). Branch from `develop`
  (gitflow); never commit straight to `main`.
- Keep permissions, network destinations and stored data minimal. Update
  `docs/privacy-policy.md` if any of them change.
- Validate external data with Zod; keep `http(s)`-only URLs; never use `eval`, inline scripts or
  `dangerouslySetInnerHTML`.
- UI: follow `.claude/skills/shadcn` rules. Use semantic tokens (`--brand` = deq-sun amber,
  `--live` = Kurdistan green); no `dark:` colour overrides; `gap-*` instead of `space-*`;
  `aria-label` on icon buttons; `dir="auto"` on station names.
- Popup size is fixed at 400×600.
- Station IDs are `<prefix>:<native id>` (`ku:`, `rb:`, `soma:`, `laut:`, `custom:`, `url:`,
  `local:`). Never renumber curated station IDs.
- Changing stored data or backups needs a migration in `storage/legacy.ts` or `backup/backup.ts`,
  plus tests.
- The logo (`assets/brand`, deq Roj) changes only with the maintainer's approval.
