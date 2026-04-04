# Tajdîn — development guide

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
   git clone <repository-url> tajdin
   cd tajdin
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
- [ ] **Popup** opens from the toolbar icon and shows the basic Tajdîn UI (dark shell, title, main tabs including **About**, bottom **Player** bar: station line above artwork, prev/play/next, shuffle, mute, volume).
- [ ] **Options** open from the toolbar **gear** in the popup (`chrome.runtime.openOptionsPage()`), from “Extension options” on the extension card, or the manifest options URL, and render the settings shell (General, Stations, Playlists, Groups).
- [ ] **Storage sync** — change a setting on the options page (for example theme) and confirm the popup updates without a full reload (`chrome.storage.onChanged` on `tajdin.*` keys; legacy `zeng.*` is migrated to `tajdin.*` on startup).
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
2. Click **Reload** on Tajdîn
3. Open the popup or options page again to see changes

This is the most reliable workflow for **Manifest V3** + **Vite** until a dedicated extension HMR setup (for example a CRXJS-based pipeline) is added.

### Typechecking

```bash
npm run typecheck
```

Run **`npm run lint`** and this before commits and when refactoring shared types.

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
| `npm run lint`        | ESLint on `src/**/*.ts(x)` and `scripts/**/*.mjs`    |
| `npm run pack:zip`    | Zip `dist/` → `artifacts/tajdin-extension-v{version}.zip` (needs `zip` CLI) |
| `npm run pack:extension` | `build` then `pack:zip` (Web Store bundle)     |
| `npm run test`        | `vitest run` (unit tests)                          |
| `npm run typecheck`   | `tsc --noEmit` across `src/`                      |
| `npm run dev`     | Vite dev server (see limitations above)                |

GitHub Actions (`.github/workflows/`): **CI** (Task Master JSON, `npm ci`, audit, lint, typecheck, test, build, `verify:dist`), **Security audit** (scheduled + PR `npm audit`), **Dependency review** (PRs), **CodeQL** (JS/TS on push/PR + weekly), **Release** (tag `v*` or manual: verify + pack + upload artifact).

## Where things live

| Path                 | Role |
|----------------------|------|
| `manifest.json`      | Source manifest; copied into `dist/` on build. **`host_permissions`** include Radio Browser API hosts plus **`http://*/*`** and **`https://*/*`** so the offscreen `<audio>` element may load arbitrary station stream URLs (API metadata alone is not enough).          |
| `public/icons/`      | Toolbar / store icons (`tajdin-radio-50.png`, `tajdin-radio-100.png`); copied to `dist/icons/` by Vite |
| `src/background/`    | Service worker: `index.ts`, `audio-engine.ts` (`tajdin/player/*` → offscreen + ~20s `chrome.alarms` keep-alive), `offscreen-document.ts` |
| `src/popup/`         | `index.html` sets `class="… tajdin-popup-root"`; `globals.css` clips **document** overflow (`html`/`body`/`#root` `overflow:hidden` only — no `height:100%` on that chain so the popup document sizes from `App`’s configured `popupWidthPx`/`popupHeightPx` and the header is not clipped). Lists scroll inside `StationList` / `PlaylistsPage` / Virtuoso. `App.tsx`: `PopupHeader` → `TabNav` (Browse / Favs / Lists / About, ~44px min touch width) → `main` + `TabPanel` (`min-h-0`, `overflow-hidden` chain; About tab: scrollable reused `AboutSection` with popup `surface`) → **`PlayerDock`** (~88px, transport) → **`AttributionFooter`** (Made by… / Source / version). `SurfaceContext` for light/dark. `components/`: `Player` (session `stationuuid` rehydrates full station via `ensurePlayerStationResolved` on popup load + on Play if needed; `StationArt` uses station favicon/cover whenever available while playing or stopped, EQ overlay when playing; toolbar / `chrome://extensions` use packaged icons from `manifest.json` only), `PlaylistsPage` (settings + Lists tab: DnD reorder, remove row, add from favourites/custom/id; popup: row context menu + player add-to-playlist), `AddStationModal`, `StationSearchBar` (exact API name vs single regex toggle), `StationLanguageFilter`, `StationCard`, `StationList` (idle browse: Radio Browser `order=random` for discovery; name search / regex corpus use ranked `clickcount`; empty-query mode toggles avoid redundant refetch); `playerPlayback.ts`; `playerBridge.ts`; `stationLibraryApi.ts`; `store/` + sync |
| `src/settings/`      | Full-tab options UI: sidebar branding (`ExtensionBranding`, `titleTag="h1"`) + nav + `GeneralSettingsSection`, `CustomStationsTable` (add via reused popup `AddStationModal`, edit via `EditCustomStationModal`), `AboutSection` (default dark surface; popup About tab passes `surface` from `SurfaceContext`), reused `PlaylistsPage` / `GroupsPage`; listens to `chrome.storage.local` changes for `tajdin.*` (and legacy `zeng.*` during migration) to stay in sync with the popup |
| `src/offscreen/`     | Offscreen doc: `<audio id="player">`, `index.ts` handles `tajdin/offscreen/*` (load, play, pause, volume, state). SW: `offscreen-document.ts` + `tajdin/sw/ensure-offscreen` / `tajdin/sw/ping-offscreen` |
| `src/shared/`        | `constants/links.ts` (canonical GitHub URLs: `0xdolan/tajdin` repo, issues, author profile), `components/ExtensionBranding.tsx` (icon + Tajdîn wordmark + “Always by your side · Radio Browser” for popup header and options sidebar), `types/` (`Station.coverUrl` optional for custom artwork), `storage/` (`storage-migration.ts` copies legacy `zeng.*` keys to `tajdin.*`), `import-export/` (`backup-schema.ts`, `backup-io.ts` — Zod `tajdin-backup` v1 JSON on export, import also accepts legacy `zeng-backup`, merge vs replace), `utils/sanitize.ts` (display text + http(s) URLs + `stationArtworkHttpUrl` for list/player artwork), `utils/list-scrollbar.ts` + `globals.css` `.tajdin-scrollbar-{light,dark}` (Firefox `scrollbar-color` + WebKit pseudo-elements for `StationList` / `FavouritesStationList` via `TajdinVirtuosoScroller`, and `PlaylistsPage` overflow), `utils/fuzzy-search.ts`, `utils/language-mapper.ts`, `utils/group-icon-keys.ts`, `utils/validate-stream-url.ts`, `utils/station-merge.ts`, `api/radio-browser.api.ts` (`RadioBrowserClient`, primary + fallback hosts, rate-spaced queue) |
| `vite.config.ts`     | Multi-entry build, `base: './'` for extension-relative assets |
| `dist/`              | **Output only** — gitignored; load this folder in Chrome |

## Troubleshooting

- **Blank popup or broken styles** — Confirm you loaded **`dist/`**, not the repo root. Asset URLs in HTML are **relative** (`../../assets/...`); loading the wrong root breaks them.
- **Changes not visible** — Run a build (or watch), then **Reload** the extension on `chrome://extensions`.
- **`npm ci` fails** — Ensure `package-lock.json` is present and committed; otherwise run `npm install` once and commit the lockfile.
- **Type errors after moving files** — Run `npm run typecheck`. Prefer **relative** imports in `src/` so `tsc` stays simple; use Vite’s `@` alias in `vite.config.ts` only if you add matching `paths` in `tsconfig.json` (with `./` prefixes, never `baseUrl`).
- **Click a station but nothing plays** — Ensure the built `dist/manifest.json` includes broad **`http://*/*`** and **`https://*/*`** `host_permissions` (see source `manifest.json`). Without them, Chromium blocks the offscreen player from loading most stream URLs even though the Radio Browser API works.

## Security note for local work

Do not commit **`.env`**, API keys, or **`.cursor/mcp.json`** if it contains secrets. See `SECURITY.md` and `.env.example`.
