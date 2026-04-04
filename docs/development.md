# Zeng — development guide

How to run the project from scratch, produce a loadable Chrome extension, and iterate during development.

## Prerequisites

- **Node.js** 22.x (LTS) and **npm** 10+  
  - Check: `node -v` and `npm -v`
- **Google Chrome** (or another Chromium browser) with developer mode for extensions
- **Git** (to clone the repository)

In **VS Code / Cursor**, use the workspace TypeScript version when prompted (`.vscode/settings.json` points at `node_modules/typescript/lib`) so the editor matches `npm run typecheck`.

Optional:

- **Task Master CLI** (`task-master`) if you use `.taskmaster/tasks/tasks.json` for task tracking

## Run from scratch

1. **Clone** the repository and enter the project directory:

   ```bash
   git clone <repository-url> zeng
   cd zeng
   ```

2. **Install dependencies** (uses `package-lock.json` for reproducible installs):

   ```bash
   npm ci
   ```

   If you do not have a lockfile yet, use `npm install` once, then commit `package-lock.json`.

3. **Production build** (writes the extension into `dist/` and copies `manifest.json` there):

   ```bash
   npm run build
   ```

4. **Sanity-check the build** (optional but recommended; same checks run in CI after `build`):

   ```bash
   npm run verify:dist
   ```

   Or build and verify in one step:

   ```bash
   npm run verify:extension
   ```

5. **Load the extension in Chrome**

   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the **`dist/`** directory inside the repo (not the repository root)

The popup, options page, and service worker paths in `manifest.json` match the files Vite emits under `dist/` (for example `src/popup/index.html` inside `dist/`).

## Manual checklist (Chrome)

After `npm run build` (or `build:watch`), load **`dist/`** as unpacked and confirm:

- [ ] **No manifest errors** on the extension card on `chrome://extensions`.
- [ ] **Service worker** is active (click “Service worker” / inspect; no crash on startup).
- [ ] **Popup** opens from the toolbar icon and shows the basic Zeng UI (dark shell, title).
- [ ] **Options** open (from “Extension options” or your UI entry) and render the settings shell.
- [ ] **Permissions** listed on the card include **storage**, **alarms**, **offscreen**, and Radio Browser **host** access.

Automated checks in `npm run verify:dist` do **not** replace this pass; they only validate `dist/` layout and manifest fields.

## Day-to-day development

### Recommended: watch mode + reload extension

Chrome loads a **static folder** (`dist/`). After code changes, rebuild and refresh the extension:

```bash
npm run build:watch
```

Leave that process running. After each successful rebuild:

1. Go to `chrome://extensions`
2. Click **Reload** on Zeng
3. Open the popup or options page again to see changes

This is the most reliable workflow for **Manifest V3** + **Vite** until a dedicated extension HMR setup (for example a CRXJS-based pipeline) is added.

### Typechecking

```bash
npm run typecheck
```

Run this before commits and when refactoring shared types.

### Tests

```bash
npm test
```

Runs **Vitest** in Node (`vitest run`). Watch mode: `npx vitest`.

### `npm run dev` (Vite dev server)

`vite` starts a local dev server (default port **5173**). The **unpacked extension does not use that server**; it only serves files from `dist/`. You can still use `npm run dev` to:

- Quickly preview **non-extension** behavior in a normal browser tab (limited: `chrome.*` APIs are unavailable), or
- Experiment with UI-only components if you open built HTML manually

For real extension behavior (storage, service worker, host permissions), use **`build:watch`** and reload the extension as above.

## npm scripts

| Script            | Purpose                                                |
|-------------------|--------------------------------------------------------|
| `npm run build`   | Production build to `dist/` + copy `manifest.json`     |
| `npm run build:watch` | Same as `build`, rebuilds when sources change     |
| `npm run verify:dist` | Assert `dist/` manifest, entries, and key files exist |
| `npm run verify:extension` | `build` then `verify:dist` (local smoke)      |
| `npm run test`        | `vitest run` (unit tests)                          |
| `npm run typecheck`   | `tsc --noEmit` across `src/`                      |
| `npm run dev`     | Vite dev server (see limitations above)                |

## Where things live

| Path                 | Role |
|----------------------|------|
| `manifest.json`      | Source manifest; copied into `dist/` on build          |
| `src/background/`    | Service worker entry (`index.ts` → `dist/background.js`) |
| `src/popup/`         | Extension popup (React + Tailwind)                     |
| `src/settings/`      | Full-tab options UI (React + Tailwind)                 |
| `src/offscreen/`     | Offscreen doc: `<audio id="player">`, `index.ts` handles `zeng/offscreen/*` (load, play, pause, volume, state). SW: `offscreen-document.ts` + `zeng/sw/ensure-offscreen` / `zeng/sw/ping-offscreen` |
| `src/shared/`        | `types/`, `storage/`, `api/radio-browser.api.ts` (`RadioBrowserClient`, primary + fallback hosts, rate-spaced queue) |
| `vite.config.ts`     | Multi-entry build, `base: './'` for extension-relative assets |
| `dist/`              | **Output only** — gitignored; load this folder in Chrome |

## Troubleshooting

- **Blank popup or broken styles** — Confirm you loaded **`dist/`**, not the repo root. Asset URLs in HTML are **relative** (`../../assets/...`); loading the wrong root breaks them.
- **Changes not visible** — Run a build (or watch), then **Reload** the extension on `chrome://extensions`.
- **`npm ci` fails** — Ensure `package-lock.json` is present and committed; otherwise run `npm install` once and commit the lockfile.
- **Type errors after moving files** — Run `npm run typecheck`. Prefer **relative** imports in `src/` so `tsc` stays simple; use Vite’s `@` alias in `vite.config.ts` only if you add matching `paths` in `tsconfig.json` (with `./` prefixes, never `baseUrl`).

## Security note for local work

Do not commit **`.env`**, API keys, or **`.cursor/mcp.json`** if it contains secrets. See `SECURITY.md` and `.env.example`.
