# Changelog

All notable changes to Tajdîn. The format follows [Keep a Changelog](https://keepachangelog.com/),
and versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

### Features

- **Favourites, one tap away.** A ♥ button in the popup opens your favourites, and a new
  **Options → Favourites** tab lists every station you've hearted, with play all, reordering and
  remove with undo.
- **Filter, search and sort on every list:** popup, desktop view, favourites, playlists, groups
  and your stations. Filter by text, language or source; sort by name, country, language,
  quality or source. The playlist and group lists in Options can be searched and sorted too.
- **About:** the story behind the name, from the Kurdish epic _Mem û Zîn_, with links to
  Wikipedia and the book. "Made with ♥" now shows the heart.

- **New fonts:** Manrope for Latin text and Sahel for Arabic script (Kurdish Sorani, Arabic,
  Persian), chosen per character and bundled with the extension.

### Fixes

- The volume control in the popup is now a slim vertical slider that fits the popup; wider
  players keep the horizontal slider.
- The language submenu in the popup fully covers the menu behind it.
- The release sources zip is built with `git archive`, so building no longer prints a warning
  per file.

## [0.1.0](https://github.com/0xdolan/tajdin/releases/tag/v0.1.0) · 2026-10-25

Tajdîn has been rebuilt from scratch, with a new design, a new logo and a Firefox version.
Your favourites, playlists, custom stations and settings from 0.0.x move over automatically.

### Highlights

- **New logo**: the Roj, the sun from Kurdish _deq_ tattoos, broadcasting. The toolbar icon now
  shows what's happening: grey when idle, amber when paused, and a pulsing green wave while playing.
- **Firefox**: Tajdîn is now on Firefox Add-ons as well as the Chrome Web Store.
- **Desktop view and website**: a full-window player, also at
  [0xdolan.github.io/tajdin](https://0xdolan.github.io/tajdin/). It starts a station as soon as it
  opens.
- **A fresh mix every time**: the popup opens on a new random set of stations, or on a favourite
  list, playlist, group or language you choose in Settings.
- **More stations**: SomaFM and laut.fm join Radio Browser and the curated Kurdish list.
- **Play anything**: paste any stream link or pick an audio file from your computer.
- **Groups**: hand-picked groups, and language groups that fill themselves with every station in
  a language.

### Player

- Play/pause, previous/next, random, repeat (off, whole list, one station with automatic reconnect).
- Speed control for local files.
- Optional "On air" song line, above or below the player.
- Dead stations in a list are skipped automatically.
- Media keys, browser-wide shortcuts and in-app keys (Space, N, P, R, M, ↑/↓).

### Library and backup

- Settings and Options in one tabbed page: General, Playback, Shortcuts, My stations, Playlists,
  Groups, Backup and About.
- Playlists reorder by drag and drop or keyboard. Deleting asks first and can be undone.
- Backup export with a choice of sections. Import shows a preview and offers merge or replace per
  section. Backups from Tajdîn 0.0.x still import.

### Under the hood

- TypeScript monorepo (pnpm + Turborepo): shared core, shadcn/ui component package, WXT extension
  and Vite website.
- Chrome (Manifest V3, offscreen audio) and Firefox (persistent background audio).
- CI with lint, type checks, unit tests, Firefox validation and a browser smoke test. Tagged
  releases publish zips to GitHub and submit to both stores.

## [0.0.2](https://github.com/0xdolan/tajdin/releases/tag/v0.0.2)

- UI refresh, accessibility focus rings and loading skeletons.

## [0.0.1](https://github.com/0xdolan/tajdin/releases/tag/v0.0.1)

- First Chrome release: Radio Browser search, favourites, playlists, custom stations and backups.
