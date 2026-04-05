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
- [ ] **Popup** opens from the toolbar icon and shows the basic Tajdîn UI (dark shell, title, main tabs including **About**, bottom **Player** bar: station line above controls, one row (no horizontal scroll): compact `h-7`/`h-8` controls, artwork uses shared **`RadioFallbackIcon`** when no favicon/cover (same as list rows), prev/play/next, random, **favourite heart** with same button chrome as random (rose when saved), add-to-playlist, mute icon matches **volume 0 or muted** (else speaker-wave), shorter fixed-width volume slider).
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

### Keyboard shortcuts and OS media controls

- **`manifest.json` `commands`** — Global shortcuts (customizable in **`chrome://extensions/shortcuts`**): play/pause (default **media Play/Pause**), next / previous track (**media Next/Previous**), mute (**Ctrl+Shift+9** / **⌘⇧9**), open popup (**Ctrl+Shift+Y** / **⌘⇧Y**). The service worker runs `session-playback.ts` so these work when the popup is closed, using the last station and playlist/favourites context in `chrome.storage.session`.
- **Media Session API** — The offscreen document sets `navigator.mediaSession` metadata when playback starts and registers **play / pause / nexttrack / previoustrack** handlers that message the service worker (`tajdin/sw/media-session-action`). OS media keys and lock-screen controls apply where Chromium exposes them for the active media session.
- **Playback feedback** — `PlaybackFeedbackToast` (above `PlayerDock`, `aria-live="polite"`) shows short messages from `playerPlayback` when a stream fails to load or play (including playlist skip hints).
- **Welcome strip** — First-run tips live in `WelcomeOnboardingBanner` (below `TabNav`). Dismissal sets **`welcomePanelDismissed`** in `tajdin.settings.v1` (merged via `parseSettingsWithDefaults`).
- **Playlist delete** — After delete, an **Undo** bar appears on the Lists tab for ~12s (`restorePlaylist`); confirm copy explains removal + undo.

GitHub Actions (`.github/workflows/`): **CI** (Task Master JSON, `npm ci`, audit, lint, typecheck, test, build, `verify:dist`), **Security audit** (scheduled + PR `npm audit`), **Dependency review** (PRs), **CodeQL** (JS/TS on push/PR + weekly), **Release** (tag `v*` or manual: verify + pack + upload artifact).

## Where things live

| Path                 | Role |
|----------------------|------|
| `manifest.json`      | Source manifest; copied into `dist/` on build. **`host_permissions`** include Radio Browser API hosts plus **`http://*/*`** and **`https://*/*`** so the offscreen `<audio>` element may load arbitrary station stream URLs (API metadata alone is not enough).          |
| `public/logo/`       | Tajdîn marks: **SVG** (UI via `tajdinMarkSvgUrl()`), **PNG/JPG/PDF** (README, exports, print). `manifest.json` `icons` + `action.default_icon` use **`logo/tajdin-logo-black.png`** (raster required by Chromium). Copied to `dist/logo/` |
| `src/background/`    | Service worker: `index.ts` (`chrome.commands` → `session-playback.ts`; `tajdin/sw/media-session-action` from offscreen), `session-playback.ts` (session mirror + next/prev/mute/play), `audio-engine.ts` (`tajdin/player/*` → offscreen + ~20s `chrome.alarms` keep-alive), `offscreen-document.ts` |
| `src/popup/`         | `index.html` sets `class="… tajdin-popup-root"`; `globals.css` clips **document** overflow (`html`/`body`/`#root` `overflow:hidden` only — no `height:100%` on that chain so the popup document sizes from `App`’s configured `popupWidthPx`/`popupHeightPx` and the header is not clipped). Lists scroll inside `StationList` / `PlaylistsPage` / Virtuoso. `App.tsx`: `PopupHeader` → `TabNav` → optional **`WelcomeOnboardingBanner`** → `main` + `TabPanel` (`min-h-0`, `overflow-hidden` chain; About tab: scrollable reused `AboutSection` with popup `surface`) → **`PlaybackFeedbackToast`** → **`PlayerDock`** (footer `min-h-0`, compact `py-1.5`; `Player`: metadata row then one controls row (fits default popup width; `ms-auto` mute + compact volume) — artwork `h-8`, `RadioFallbackIcon` when no art, `h-7` nav / `h-8` play, random · heart (`navBtn` + rose) · add-to-playlist, mute / volume icons from level + mute) → **`AttributionFooter`** (Made by… / Source / version). `SurfaceContext` for light/dark. `components/`: `Player` (session `stationuuid` rehydrates full station via `ensurePlayerStationResolved` on popup load + on Play if needed; **Favourite heart** between random and add-to-playlist (`toggleFavourite`, borderless in player); `StationArt` uses station favicon/cover whenever available while playing or stopped, signal-style placeholder when not, EQ overlay when playing; Heroicons-style speaker-wave / speaker-x-mark + shuffle arrow for random; default volume **75%** on first run via `DEFAULT_PLAYER_VOLUME_PERCENT`, persisted in `chrome.storage.session` with other session player fields; `loadUrlAndPlay` applies muted/volume to offscreen before play; toolbar / `chrome://extensions` use packaged icons from `manifest.json` only), `PlaylistsPage` re-exports from `components/playlists/PlaylistsPage.tsx` (popup Lists + settings: intro copy; **Create playlist** card; **Your playlists** button list with counts (replaces `<select>`); **Edit playlist** card — rename, delete with confirm, DnD reorder, Play/Remove per row, collapsible favourites/custom/id importers; then **Add stations from search** with `useLocalSearch` + `StationSearchBar` + Browse language filter; `StationList` `isolated` + row tap appends to selected playlist; shared tokens in `playlists/playlistSurfaceClasses.ts`), `AddStationModal` (required `draftScope`: `popup` vs `settings`; form + `modalOpen` persisted in `chrome.storage.session` via `addStationDraftSession.ts` / `SessionAddStationDraftSchema` so closing the popup or dismissing the overlay keeps draft until **Cancel** or successful **Save**), `StationSearchBar` (exact API name vs single regex toggle), `StationLanguageFilter`, `StationCard` (Radix context menu + **`@radix-ui/react-dropdown-menu`** row “add to playlist”, portaled; horizontal heart / add / copy via `utils/stationRowIconButton.ts` matching `StationFavicon` frame tokens; compact row height via `constants/stationListLayout.ts`), `StationList` (optional `isolated` keeps results off global `useStationStore` for in-tab search; default browse does **not** merge custom stations — use **Custom only** toggle for `custom:*` list + client-side exact/regex filter; idle browse: Radio Browser `order=random` for discovery; name search / regex corpus use ranked `clickcount`; empty-query mode toggles avoid redundant refetch); `hooks/useSearch` (`useSearch` session + `useLocalSearch` for Playlists tab); `BrowseCustomStationsToggle`; `uiStore` / `popupStorageSync` session UI (`SessionUiSchema` includes optional `browseCustomStationsOnly`); `playerPlayback.ts`; `playerBridge.ts`; `stationLibraryApi.ts` (`resolveFavouriteStationsForLibrary` loads custom stations once and resolves radio favourites via a single Radio Browser POST `byuuid` batch); `store/` + sync |
| `src/settings/`      | Full-tab options UI: sidebar branding (`ExtensionBranding`, `titleTag="h1"`) + nav + `GeneralSettingsSection`, `CustomStationsTable` (add via reused popup `AddStationModal`, edit via `EditCustomStationModal`), `AboutSection` (default dark surface; popup About tab passes `surface` from `SurfaceContext`), reused `PlaylistsPage` / `GroupsPage`; listens to `chrome.storage.local` changes for `tajdin.*` (and legacy `zeng.*` during migration) to stay in sync with the popup |
| `src/offscreen/`     | Offscreen doc: `<audio id="player">`, `index.ts` handles `tajdin/offscreen/*` (load, play, pause, volume, state, **set/clear media metadata**, Media Session action handlers → SW). SW: `offscreen-document.ts` + `tajdin/sw/ensure-offscreen` / `tajdin/sw/ping-offscreen` |
| `src/shared/`        | `data/kurdishCuratedStations.json` + `kurdishCuratedStations.ts` (bundled Kurdish streams, `tajdin:kurdish:*` uuids; Browse language **Kurdish** uses this list, not Radio Browser); `constants/links.ts` (canonical GitHub URLs: `0xdolan/tajdin` repo, issues, author profile), `components/ExtensionBranding.tsx` + `constants/branding.ts` (icon + Tajdîn wordmark + tagline `always by your side; Radio Browser.`; full line in `manifest.json` / `package.json`), `types/` (`Station.coverUrl` optional for custom artwork; `Settings.defaultLanguageCode` default `ku` → Kurdish list on first session), `storage/` (`storage-migration.ts` copies legacy `zeng.*` keys to `tajdin.*`), `import-export/` (`backup-schema.ts`, `backup-io.ts` — Zod `tajdin-backup` v1 JSON on export, import also accepts legacy `zeng-backup`, merge vs replace), `utils/sanitize.ts` (display text + http(s) URLs + `stationArtworkHttpUrl` for list/player artwork), `utils/list-scrollbar.ts` + `globals.css` `.tajdin-scrollbar-{light,dark}` (Firefox `scrollbar-color` + WebKit pseudo-elements for `StationList` / `FavouritesStationList` via `TajdinVirtuosoScroller`, and `PlaylistsPage` overflow), `.tajdin-volume-range` / `--light` / `--dark` (player volume slider track + thumb), `utils/fuzzy-search.ts`, `utils/language-mapper.ts` (`TAJDIN_KURDISH_CURATED_LANGUAGE_VALUE`, `defaultLanguageCodeToBrowseApiValue`), `utils/group-icon-keys.ts`, `utils/validate-stream-url.ts`, `utils/station-merge.ts`, `api/radio-browser.api.ts` (`RadioBrowserClient`, primary + fallback hosts, rate-spaced queue; `fetchStationsByUuids` POST `{ uuids }` for multi-station resolve) |
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
