# Changelog

All notable changes to Tajdîn. The format follows [Keep a Changelog](https://keepachangelog.com/),
and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.5](https://github.com/0xdolan/tajdin/releases/tag/v0.1.5) · 2026-10-25

### Fixes

- **Mute works on iPhone and iPad.** Safari there doesn't let pages change the volume, so muting
  did nothing. Mute now uses the audio's own mute switch, and on iPhone and iPad the volume button
  simply mutes and unmutes (the device's volume buttons set the level).
- **The website and desktop view fit phone screens.** Settings switches to a scrollable tab strip,
  options stack under their labels, selects fit the width, the player uses its compact layout,
  nothing scrolls sideways (even on 320px-wide phones), search fields no longer make Safari zoom
  in, and the bottom bar clears the iPhone home indicator.

### Maintenance

- Every page is now checked on iPhone and Android screen sizes in WebKit, Safari's engine, on
  each change.
- A simpler branch flow: all changes go to `main` through pull requests that merge themselves when
  the checks pass, and `develop` automatically mirrors `main`. The website now updates with each
  release.

## [0.1.4](https://github.com/0xdolan/tajdin/releases/tag/v0.1.4) · 2026-10-25

### Security

- Song information from radio streams and regex searches are now parsed with simple linear scans,
  so a malicious stream or pattern can't slow Tajdîn down (all four code-scanning alerts
  resolved).

### Maintenance

- The release-notes tool no longer builds a regular expression from its input.
- The repository's language statistics no longer count the design-tool scripts.

## [0.1.3](https://github.com/0xdolan/tajdin/releases/tag/v0.1.3) · 2026-10-25

No changes to how Tajdîn works; this release brings the project's release process up to date.

### Maintenance

- Releases and the merge back into development now go entirely through reviewed pull requests,
  with checks passing before anything reaches the released branch.

## [0.1.2](https://github.com/0xdolan/tajdin/releases/tag/v0.1.2) · 2026-10-25

### Changes

- The About page and README write Tajdîn's name in Kurdish script, Tajdîn (تاژدین), rendered in
  Sahel and isolated as right-to-left text so punctuation stays in place.
- The README feature list no longer uses emojis.

### Fixes

- Manrope and Sahel now apply everywhere. Chrome injects a system font into extension pages and
  the toast library sets its own, so most text (including Arabic-script names in menus) showed in
  Arial. The documentation pages on the website use the same fonts too.
- Store releases: a new version now replaces a Chrome Web Store submission that is still waiting
  for review, instead of the upload being refused.

## [0.1.1](https://github.com/0xdolan/tajdin/releases/tag/v0.1.1) · 2026-10-25

### Features

- **Favourites, one tap away.** A ♥ button in the popup opens your favourites, and a new
  **Options → Favourites** tab lists every station you've hearted, with play all, reordering and
  remove with undo.
- **Filter, search and sort on every list:** popup, desktop view, favourites, playlists, groups
  and your stations. Filter by text, language or source; sort by name, country, language,
  quality or source. The playlist and group lists in Options can be searched and sorted too.
- **About and README:** "Why Tajdîn?" and the story behind the name, from the Kurdish epic
  _Mem û Zîn_, with links to Wikipedia and the book. "Made with ♥" now shows the heart.
- **New fonts:** Manrope for Latin text and Sahel for Arabic script (Kurdish Sorani, Arabic,
  Persian), chosen per character and bundled with the extension.

### Fixes

- The volume control in the popup is now a slim vertical slider that fits the popup; wider
  players keep the horizontal slider.
- The language submenu in the popup fully covers the menu behind it.
- The popup's desktop-view and settings buttons work on the first click (the popup closed
  before the tab finished opening).
- A more compact popup player, better padding for the desktop and settings player bars, and a
  centred welcome box in the popup.
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
