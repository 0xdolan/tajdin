# Tajdîn — development guide

How to run the project from scratch, produce a loadable Chrome extension, and iterate during development.

## Prerequisites

- **Node.js** 22.x (LTS) and **npm** 10+ (matches CI `setup-node`) — check `node -v` and `npm -v`
- **Google Chrome** **116+** (matches `minimum_chrome_version` in `manifest.json`) with developer mode for extensions
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

4. **Sanity-check the build** (optional but recommended; CI runs this after `build`):

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

The popup, options page, offscreen page, and service worker paths in `manifest.json` match what Vite emits under `dist/` (for example `dist/src/popup/index.html`).

## Manual checklist (Chrome)

After `npm run build` (or `build:watch`), load **`dist/`** as unpacked and confirm:

- [ ] **No manifest errors** on the extension card on `chrome://extensions`.
- [ ] **Service worker** is active (click “Service worker” / inspect; no crash on startup).
- [ ] **Popup** — toolbar icon opens the popup: **Browse** / **Favs** / **Lists** / **About**; optional **welcome** strip until dismissed; **player** at the bottom (prev / play / next, random, favourite, add to playlist, mute, volume); **playback feedback** strip above the player when a stream fails.
- [ ] **Shortcuts** (optional) — `chrome://extensions/shortcuts`: try play/pause or open popup while the popup is closed, if you have already started playback once.
- [ ] **Options** — gear in the popup (`chrome.runtime.openOptionsPage()`), “Extension options” on the card, or manifest options URL: **General**, **Stations**, **Playlists**, **Backup**, **About**.
- [ ] **Storage sync** — change a setting on the options page (for example theme) and confirm the popup updates without a full reload (`chrome.storage.onChanged` on `tajdin.*` keys; legacy `zeng.*` is migrated to `tajdin.*` on startup).
- [ ] **Permissions** on the card include **storage**, **alarms**, **offscreen**, **clipboardWrite**, and Radio Browser + broad **host** access for streams.

Automated checks in `npm run verify:dist` do **not** replace this pass; they validate `dist/` layout, manifest fields, CSP (no `unsafe-eval`, `script-src 'self'`), and that popup/options/offscreen HTML reference built scripts.

## Day-to-day development

### Recommended: watch mode + reload extension

Chrome loads a **static folder** (`dist/`). After code changes, rebuild and refresh the extension:

```bash
npm run build:watch
```

After each successful rebuild:

1. Go to `chrome://extensions`
2. Click **Reload** on Tajdîn
3. Open the popup or options page again

This is the reliable workflow for **Manifest V3** + **Vite** until a dedicated extension HMR pipeline (for example CRXJS) is added.

### Typechecking and lint

```bash
npm run typecheck
npm run lint
```

Run both before commits and when refactoring shared types.

### Tests

```bash
npm test
```

Runs **Vitest** (`vitest run`). Watch mode: `npx vitest`.

### `npm run dev` (Vite dev server)

`vite` starts a local dev server (default port **5173**). The **unpacked extension does not use that server**; it only serves files from `dist/`. You can still use `npm run dev` for quick non-extension previews ( **`chrome.*` APIs are unavailable** in a normal tab).

For real extension behavior, use **`build:watch`** and reload the extension as above.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build to `dist/` + copy `manifest.json` |
| `npm run build:watch` | Same as `build`, rebuilds when sources change |
| `npm run verify:dist` | Assert `dist/` manifest, entries, CSP, icons, HTML, offscreen `<audio>` |
| `npm run verify:extension` | `build` then `verify:dist` |
| `npm run lint` | ESLint on `src/**/*.{ts,tsx}` and `scripts/**/*.mjs` |
| `npm run pack:zip` | Zip `dist/` → `artifacts/tajdin-extension-v{version}.zip` (needs `zip` CLI) |
| `npm run pack:extension` | `build` then `pack:zip` (Web Store bundle) |
| `npm run test` | `vitest run` |
| `npm run typecheck` | `tsc --noEmit` across `src/` |
| `npm run dev` | Vite dev server (see limitations above) |

### Keyboard shortcuts and OS media controls

- **`manifest.json` `commands`** — Chromium allows **at most four** default shortcuts per extension. Defaults here: play/pause (**`MediaPlayPause`**), next (**`MediaNextTrack`**), previous (**`MediaPrevTrack`** — not `MediaPreviousTrack`; that string is rejected at install), mute (**Ctrl+Shift+9** / **⌘⇧9**). **Open popup** is declared with **no** default binding; assign it under **`chrome://extensions/shortcuts`**. Remap any command there. The service worker uses **`session-playback.ts`** with **`chrome.storage.session`** so these work when the popup is closed (playlist or favourites context).
- **Media Session API** — Offscreen sets **`navigator.mediaSession`** metadata and **play / pause / nexttrack / previoustrack** handlers that post **`tajdin/sw/media-session-action`** to the service worker.
- **Playback feedback** — **`PlaybackFeedbackToast`** (`aria-live="polite"`) above **`PlayerDock`**; messages from **`playerPlayback`** on load/play failure (including playlist skip hints).
- **Welcome strip** — **`WelcomeOnboardingBanner`** below **`TabNav`**; dismiss sets **`welcomePanelDismissed`** in settings (`tajdin.settings.v1`).
- **Playlist delete** — **Undo** bar on the Lists tab for ~12 seconds via **`restorePlaylist`**.

## CI (GitHub Actions)

Workflows under **`.github/workflows/`**:

- **CI** (`ci.yml`) — On push/PR to `main` / `develop` / `release/**`: validate Task Master JSON with `jq` (if present), **Node 22**, `npm ci`, **`npm audit --audit-level=high`**, `lint`, `typecheck`, `test`, `build`, `verify:dist`.
- **Security audit** — Scheduled / PR `npm audit`.
- **Dependency review** — PR dependency diffs.
- **CodeQL** — JS/TS analysis.
- **Release** — Tag or manual: verify + pack + artifact upload.

## Project layout

### `manifest.json`

Copied to **`dist/manifest.json`** on build. Declares **MV3**, **CSP** for extension pages, **permissions** (`storage`, `alarms`, `offscreen`, `clipboardWrite`), **host_permissions** (Radio Browser hosts + `http://*/*` + `https://*/*` for streams), **action** (popup), **options_ui**, **background** service worker, and **`commands`** (keyboard shortcuts).

### `public/logo/`

Marks for UI (**SVG** via `tajdinMarkSvgUrl()`), README, and **raster icons** referenced by `manifest.json` (copied into `dist/logo/`).

### `src/background/`

- **`index.ts`** — Startup, **`chrome.commands`**, **`chrome.runtime.onMessage`** (player commands, offscreen ping/ensure, **`tajdin/sw/media-session-action`**), migration hook.
- **`session-playback.ts`** — Reads/writes session player blob; play/pause, next/prev (playlist or favourites), mute; coordinates with **`audio-engine`**.
- **`audio-engine.ts`** — **`tajdin/player/*`** → offscreen; keep-alive **`chrome.alarms`** (~20 minutes) while playing.
- **`audio-engine.test.ts`** — Vitest for engine behavior.
- **`offscreen-document.ts`** — Create/close **`chrome.offscreen`** **AUDIO_PLAYBACK** document.

### `src/offscreen/`

**`index.html`** + **`index.ts`**: `<audio id="player">`, message handlers for load/play/pause/volume/state, **media metadata** and **Media Session** action handlers posting to the service worker.

### `src/popup/`

- **`index.html`**, **`index.tsx`**, **`App.tsx`** — Root layout: **`PopupHeader`** → **`TabNav`** → **`WelcomeOnboardingBanner`** (conditional) → **`TabPanel`** → **`PlaybackFeedbackToast`** → **`PlayerDock`** → **`AttributionFooter`**; **`SurfaceProvider`**; size/theme from **`chrome.storage.local`** settings.
- **Tabs** — **Browse** (`StationList`, `StationSearchBar`, **`StationLanguageFilter`**, **`BrowseCustomStationsToggle`**), **Favs** (`FavouritesStationList`), **Lists** (`PlaylistsPage` re-exported from **`components/playlists/PlaylistsPage.tsx`**), **About** (reused **`AboutSection`** from settings).
- **Player** — **`Player`**, **`playerStore`**, **`playerBridge`**, **`playerPlayback`**, **`mediaMetadataSync`**, **`feedbackStore`**; session sync via **`popupStorageSync`** / **`chrome.storage.session`**.
- **Library** — **`stationLibraryApi`** (playlists, favourites, custom stations, resolve-by-uuid), **`playlistAdvance`** (next/previous playable in playlist).
- **Styling** — **`globals.css`**, Tailwind, list scrollbars, volume range tokens; popup root classes avoid clipping the header.

### `src/settings/`

Full-tab **options** app: **`App.tsx`** sidebar (**`ExtensionBranding`**) and sections **General** (`GeneralSettingsSection`), **Stations** (`CustomStationsTable`, modals), **Playlists** (same **`PlaylistsPage`** as popup), **Backup** (`ImportExportSection` — export/import JSON, merge vs replace preview), **About** (`AboutSection`). Listens to **`chrome.storage.local`** for `tajdin.*` / legacy `zeng.*`.

### `src/shared/`

- **`api/radio-browser.api.ts`** — Client with primary + fallback hosts, rate-spaced queue, **`fetchStationsByUuids`**.
- **`data/`** — **`kurdishCuratedStations`** (+ JSON): bundled list when Browse language is Kurdish (`tajdin:kurdish:*` UUIDs).
- **`constants/`** — **`links.ts`** (repo/issues URLs), **`branding.ts`**, etc.
- **`components/ExtensionBranding.tsx`** — Shared header branding.
- **`import-export/`** — **`backup-schema.ts`**, **`backup-io.ts`** (`tajdin-backup` v1, legacy `zeng-backup`, merge/replace).
- **`messages/`** — **`player.ts`**, **`offscreen.ts`**, **`sw-bridge.ts`** (media session → SW).
- **`storage/`** — Wrappers, **`STORAGE_KEYS`**, Zod schemas, **`storage-migration.ts`** (`zeng.*` → `tajdin.*`).
- **`types/`** — Settings (including **`welcomePanelDismissed`**), station, playlist, etc.
- **`utils/`** — Sanitize, language mapper, stream URL validation, list scrollbar helpers, etc.

### Build and output

| Path | Role |
|------|------|
| `vite.config.ts` | Multi-entry build (`popup`, `settings`, `offscreen`, `background`), `base: './'` |
| `dist/` | **Output only** (gitignored) — load this folder in Chrome |

## Troubleshooting

- **Blank popup or broken styles** — Load **`dist/`**, not the repo root. Asset URLs in HTML are relative (`../../assets/...`).
- **Changes not visible** — Run a build (or watch), then **Reload** the extension on `chrome://extensions`.
- **`npm ci` fails** — Ensure `package-lock.json` is committed; otherwise `npm install` once and commit the lockfile.
- **Type errors after moving files** — `npm run typecheck`. Prefer **relative** imports in `src/`; Vite **`@`** alias needs matching **`tsconfig.json` `paths`** if you use it outside Vite-resolved files.
- **Station does not play** — Confirm **`dist/manifest.json`** includes **`http://*/*`** and **`https://*/*`** `host_permissions` so the offscreen player can load stream URLs.
- **Shortcuts do nothing** — Assign keys at **`chrome://extensions/shortcuts`**; playback shortcuts need a **current station** in session (start once from the popup).

## Security note for local work

Do not commit **`.env`**, API keys, or **`.cursor/mcp.json`** if it contains secrets. See **`SECURITY.md`**. The extension build does not require `.env`; **`.env.example`** is for optional Task Master / tooling keys.
