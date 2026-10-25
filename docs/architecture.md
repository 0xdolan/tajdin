# Architecture

Tajdîn is a pnpm + Turborepo monorepo. One React UI and one TypeScript core run in four places:
the extension popup, the Settings/Options page, the extension's desktop tab and the website.

```
tajdin/
├── apps/
│   ├── extension/            WXT: Chrome (MV3) and Firefox (MV2) from one codebase
│   │   ├── src/entrypoints/  background.ts, popup/, options/, desktop/, offscreen/ (Chrome only)
│   │   ├── src/lib/          platform adapter, player client, audio host, toolbar icon, storage
│   │   └── public/icon/      generated icons (pnpm icons)
│   └── web/                  Vite site for GitHub Pages (+ /docs rendered from Markdown)
├── packages/
│   ├── core/                 no React: data model, station sources, storage, backup, player
│   ├── ui/                   shadcn/ui components + the app (surfaces, hooks, dialogs)
│   └── tsconfig/             shared compiler settings
├── assets/brand/             logo SVG sources (scripts/brand-logo.py) and exports
├── docs/                     user guide, privacy policy, developer docs
└── scripts/                  icons, screenshots, release, version and verification tools
```

## Layers

```
 ┌──────────────── @tajdin/ui (React) ────────────────┐
 │ PopupApp · SettingsApp · DesktopApp                │
 │ hooks (useSettings, useLibrary, usePlayer, feed)   │
 │ components (shadcn/ui + Tajdîn components)          │
 └──────────────┬─────────────────────────────────────┘
                │ Platform interface (platform.tsx)
 ┌──────────────┴──────────────┐   ┌────────────────────────────┐
 │ extension: lib/platform.ts  │   │ web: src/platform.ts       │
 │ storage = browser.storage   │   │ storage = localStorage     │
 │ player  = messages → host   │   │ player  = in-page host     │
 └──────────────┬──────────────┘   └──────────────┬─────────────┘
                └───────────── @tajdin/core ──────┘
     sources · catalog · repository · backup · PlayerService · HtmlAudioBackend
```

The UI never touches `chrome.*` or `localStorage` directly. It talks to a `Platform`, which bundles
the repository, the session store, the catalog, a `PlayerClient` and a few navigation callbacks.

## Station sources

`packages/core/src/sources/` implements one `StationSource` per directory:

| Source          | ID prefix       | Notes                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------ |
| Curated Kurdish | `ku:`           | `data/kurdish-stations.json`, bundled                                          |
| Radio Browser   | `rb:`           | Mirror failover on network/429/5xx; requests spaced ≥ 400 ms; click reporting  |
| SomaFM          | `soma:`         | One JSON catalogue, cached 30 min; song info from `/songs/<id>.json`           |
| laut.fm         | `laut:`         | Search + random offset paging; song info from `current_song`; no language data |
| User            | `custom:`       | Stored in the library                                                          |
| Link / file     | `url:` `local:` | One-off; local files are never persisted                                       |

`createCatalog()` combines them:

- `mix()`: an interleaved random sample from every source, de-duplicated by ID and stream URL.
- `search()`: a paging session across sources. A failing directory doesn't break the others.
- `resolve()`: turns library IDs into stations, checking custom stations, then the station cache,
  then the network.

Every row from an API is validated with Zod. Text is cleaned of control and bidi-override
characters, and only `http(s)` URLs are kept.

## Data

`LibrarySchema`: `favourites[]`, `playlists[]`, `groups[]` (`manual` | `language`),
`customStations[]` and `stationCache{}` (snapshots of referenced directory stations).

| Key                  | Area    | Contents                                      |
| -------------------- | ------- | --------------------------------------------- |
| `tajdin.v2.settings` | local   | `Settings`, merged per field over defaults    |
| `tajdin.v2.library`  | local   | `Library`, invalid items dropped individually |
| `tajdin.v2.schema`   | local   | `2` once the 0.0.x migration has run          |
| `tajdin.v2.player`   | session | `PlayerState` without the queue               |
| `tajdin.v2.queue`    | session | the play queue (changes rarely)               |
| `tajdin.v2.ui.*`     | session | search text, mode and language per surface    |
| `tajdin.v2.draft.*`  | session | unsaved "add station" form                    |

`repository.migrate()` converts 0.0.x keys (`tajdin.*.v1`, `zeng.*.v1`) and IDs (raw UUID → `rb:`,
`tajdin:kurdish:N` → `ku:N`) once. Every page calls it at start-up and it's idempotent.

Backups (`backup/backup.ts`) are versioned JSON: `{ format: "tajdin-backup", version: 2, … }`.
Version 1 files (and the old `"zeng-backup"` name) are converted on import. An import is validated
completely before anything is written, then written in one `set()` call.

## Player

`PlayerService` owns the queue and the rules: repeat off/all/one, random without repeats, auto-skip
of dead stations in a list, reconnect for repeat-one, mute memory, and speed only for local files.
It drives an `AudioBackend`. The real one, `HtmlAudioBackend`, wraps an `<audio>` element, loads
hls.js on demand for `.m3u8`, treats 20 s of stalling as a failure, and polls song info (from the
directory, or one ICY metadata block from the stream).

`createPlayerHost()` combines the service, the backend, the session's local files and the Media
Session (OS media controls). Exactly one host runs per browser:

| Where   | Host lives in                         | Why                                                                                                                                                                          |
| ------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome  | offscreen document (`AUDIO_PLAYBACK`) | MV3 service workers can't play audio. Chrome closes a silent document after ~30 s; the background recreates it on the next command and rehydrates it from `storage.session`. |
| Firefox | persistent background page (MV2)      | Firefox suspends MV3 event pages after ~30 s idle even while audio plays.                                                                                                    |
| Website | the page                              | No background exists.                                                                                                                                                        |

```
popup / options / desktop                background                    audio host
   PlayerClient.send(cmd) ── runtime ──▶ dispatch(cmd) ── runtime ──▶ PlayerService
   subscribe ◀── storage.session ◀────── onHostState ◀── runtime ──── onState
                                          ├─ ToolbarIcon (idle/paused/pulsing)
                                          └─ keep-alive alarm while playing
   playFile(file) ── BroadcastChannel ─────────────────────────────▶ LocalFiles
```

Blobs can't travel through runtime messages, so local files go straight from the page to the
host over a `BroadcastChannel`.

## UI

- shadcn/ui with Base UI primitives (`packages/ui/src/components`, added with the shadcn CLI). Its
  theme tokens live in `packages/ui/src/styles/globals.css`: midnight indigo, deq-sun amber
  (`--brand`) and Kurdistan green (`--live`).
- Fonts are bundled: Manrope for Latin and other scripts, Sahel for Arabic script (Sorani, Arabic, Persian) via `unicode-range`. There are no remote assets. Chrome injects a system font on `<body>` in
  extension pages (and Sonner sets one on toasts), so `globals.css` re-applies the font with an
  unlayered rule; the website's `/docs` pages bundle the same fonts.
- `AppShell` provides the platform, data (settings + library, synced across pages through storage
  events), theme, tooltips, dialogs and toasts.
- `useStationFeed(view)` loads any view (mix, search, language, favourites, playlist, group, own
  stations) with cancellation and paging. Results are tagged with their request, so stale
  responses never show.
- Lists are virtualised (`@tanstack/react-virtual`).
- Accessibility: every action is reachable by keyboard; playlist reordering works by keyboard;
  icon buttons have labels; errors use `role="alert"`; `prefers-reduced-motion` is respected;
  station names use `dir="auto"` for right-to-left scripts.

## Security

- Extension CSP: `script-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'`.
- No `eval`: Zod runs in jitless mode and there are no inline scripts.
- Permissions are minimal: `storage`, `alarms`, `offscreen` (Chrome) and http(s) host access for
  streams. There are no content scripts and no tab access.
- All stored, imported and fetched data is validated, user text is cleaned, and only `http(s)`
  URLs are accepted.
