# Tajdîn

<p align="center">
  <img src="public/icons/tajdin-radio-100.png" alt="Tajdîn — radio broadcast icon" width="100" height="100" />
</p>

**Tajdîn** is a Chrome extension (Manifest V3) for discovering and playing **worldwide radio stations** via the [Radio Browser](https://www.radio-browser.info/) public API. It is designed for a compact popup UI, background playback through an offscreen audio document, playlists, favourites, and settings you can tune over time.

## What it does

- **Browse and search** — Find stations by name, language, country, tags, and more (API integration with primary + fallback hosts).
- **Play in the background** — Audio runs in an offscreen document so playback can continue when the popup closes (service worker + `chrome.offscreen`, alarms for keep-alive — see Task Master / PRD for the full roadmap).
- **Your library** — Favourites, playlists, and custom stations (persisted in `chrome.storage`).
- **Settings** — Full-tab options page for theme, defaults, and data export/import.

Work in progress: features land incrementally; task order lives in `.taskmaster/tasks/tasks.json`.

## Quick links

- **Setup, build, load unpacked, tests:** [docs/development.md](docs/development.md)
- **Product / UX spec:** [.taskmaster/docs/zeng-prd-v1.txt](.taskmaster/docs/zeng-prd-v1.txt)
- **Branching:** integrate on `develop`; `main` only with explicit maintainer approval (see `.cursor/rules/git-flow.mdc`)
- **Security:** [SECURITY.md](SECURITY.md)

## Icon assets

Extension and toolbar icons live under **`public/icons/`** (50×50 and 100×100 sources, referenced in `manifest.json` at standard Chrome sizes 16 / 32 / 48 / 128). Vite copies `public/` into `dist/` on build so Chrome loads them from `dist/icons/…` when you load the unpacked extension.
