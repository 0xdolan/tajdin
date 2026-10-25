# Development

## Requirements

- Node.js 22+ (`.nvmrc`)
- pnpm 10 (`corepack enable` picks the version from `package.json`)
- Python 3 (only to regenerate the logo, or for the ui-ux-pro-max design skill)

```bash
git clone git@github.com:0xdolan/tajdin.git
cd tajdin
pnpm install
```

## Everyday commands

| Command                | What it does                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Chrome with the extension loaded and hot reload (WXT)                                       |
| `pnpm dev:firefox`     | The same in Firefox                                                                         |
| `pnpm dev:web`         | The website at http://localhost:5173/tajdin/                                                |
| `pnpm check`           | Lint + format check + type check + unit tests (what CI runs first)                          |
| `pnpm test`            | Unit tests (Vitest)                                                                         |
| `pnpm build:extension` | Production zips in `apps/extension/.output/` (Chrome, Firefox, sources)                     |
| `pnpm build:web`       | The website in `apps/web/dist/`                                                             |
| `pnpm verify:release`  | Checks the zips: versions, required files, Firefox ID, no source maps                       |
| `pnpm screenshots`     | Drives the built extension and site in Chromium and saves screenshots; fails on page errors |
| `pnpm icons`           | Re-renders every PNG icon from `assets/brand/*.svg`                                         |
| `pnpm format`          | Prettier                                                                                    |

`pnpm dev` builds and watches the extension. To have WXT open a browser with it loaded
automatically, install Mozilla's runner locally first: `pnpm --filter @tajdin/extension add -D web-ext`
(it isn't a project dependency because its Android tooling pulls in an unpatched `node-forge`).

To try a production build without the dev server, load `apps/extension/.output/chrome-mv3` at
`chrome://extensions` (Developer mode → Load unpacked), or `.output/firefox-mv2/manifest.json` at
`about:debugging` → This Firefox → Load Temporary Add-on.

## Where things go

- **Data, sources, player logic** → `packages/core`. Keep it free of React and of `chrome.*`.
- **UI** → `packages/ui/src/app`. Add shadcn components with the CLI from `packages/ui`:
  `pnpm dlx shadcn@latest add <component>`.
- **Browser-specific code** → `apps/extension/src/lib`. Use `import.meta.env.CHROME` /
  `import.meta.env.FIREFOX` (build-time constants) so the other browser's code is dropped.
- **Website-only code** → `apps/web/src`.

## Tests

- Unit tests live next to the package in `packages/core/test`. Add one for every bug fix in core.
- `pnpm screenshots` is the end-to-end smoke test. It loads the real extension, plays a station,
  searches, opens every settings tab and the desktop view, then does the same for the website.
  Run `pnpm --filter @tajdin/web preview` first for the website part.

## Design tools

The repo includes two Claude Code skills in `.claude/skills/`:

- **shadcn**: project-aware help with shadcn/ui (reads `packages/ui/components.json`).
- **ui-ux-pro-max**: design-system search, for example:
  `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "audio player" --domain ux`.

## Commits and branches

See [CONTRIBUTING.md](../CONTRIBUTING.md). In short: short-lived branches from `main`, Conventional
Commits (checked by a commit hook), and `pnpm pr` to open a pull request into `main` that merges
itself once CI passes.
