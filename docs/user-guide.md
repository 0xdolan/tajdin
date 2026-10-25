# Tajdîn user guide

Tajdîn plays internet radio in your browser: a hand-picked list of Kurdish stations plus tens of
thousands of stations from around the world. It keeps playing while you browse, and everything you
save stays on your computer.

- [Install](#install)
- [The popup](#the-popup)
- [Playing](#playing)
- [Finding stations](#finding-stations)
- [Your library](#your-library): favourites, playlists, groups, your own stations
- [Play a link or a file](#play-a-link-or-a-file)
- [The desktop view and the website](#the-desktop-view-and-the-website)
- [Settings](#settings)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Backup, and moving to another browser](#backup-and-moving-to-another-browser)
- [Questions](#questions)

## Install

| Browser                       | Where                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Chrome, Edge, Brave, Vivaldi… | [Chrome Web Store](https://chromewebstore.google.com/detail/igldoeednndfkhmigohfblmlppmphock)           |
| Firefox (desktop and Android) | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tajdin/)                                     |
| Any browser, no install       | [0xdolan.github.io/tajdin](https://0xdolan.github.io/tajdin/)                                           |
| From a release zip            | See [installing from a zip](https://github.com/0xdolan/tajdin#install-from-a-release-zip) in the README |

After installing, pin Tajdîn to the toolbar (the puzzle-piece menu → pin) so the Roj icon is
always visible.

## The popup

Click the Roj icon to open the popup.

- **Top bar**: play/pause, theme (system, light, dark), desktop view, **Options** (your stations,
  playlists, groups, backup) and **Settings**.
- **List menu** (for example "Random mix ▾"): switch between the random mix, Kurdish stations, any
  language, favourites, your own stations, playlists and groups. You can also create a playlist or
  group from here.
- **🎲** gives you a new random mix. **♥** jumps to your favourites (tap again to go back).
  **Sort & filter** narrows and orders the list you're looking at. **🔍** searches every directory.
  **+** plays a link or file, or adds a station.
- **Player** at the bottom, and the footer with links and the version.

Every time you open the popup you get a **new random mix**. To open on something else (Kurdish
stations, favourites, a playlist or a group), change **Settings → General → Open on**.

### The toolbar icon

| Icon                  | Meaning                   |
| --------------------- | ------------------------- |
| Grey sun              | Nothing loaded            |
| Amber sun             | Paused                    |
| Sun with a green wave | Playing (the wave pulses) |

Turn the pulse off in **Settings → Playback → Animate while playing**.

## Playing

Click a station to play it. Music continues when the popup closes.

| Control             | What it does                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⏯ Play / pause      | Resuming a live station jumps back to the live broadcast.                                                                                                                                 |
| ⏮ ⏭ Previous / next | Moves through the list the station was played from.                                                                                                                                       |
| 🔀 Random           | A random station from the same list.                                                                                                                                                      |
| 🔁 Repeat           | **Off** → **Whole list** (wraps at the end) → **This station** (reconnects if the stream drops).                                                                                          |
| ⏱ Speed             | 0.5×–2× for local files. Live radio always plays in real time.                                                                                                                            |
| 🔊 Volume           | Click to mute; use the slider or scroll the mouse wheel over it. On iPhone and iPad, the button mutes and the device's volume buttons set the level (Safari doesn't let pages change it). |
| ♥ and ⋮             | Favourite the station; add it to a playlist or group; copy its stream link.                                                                                                               |

**Song information.** Many stations send the artist and title of what's on air. Turn it on in
**Settings → Playback → Show what's playing** and choose whether the "On air" line sits above or
below the player.

**When a station fails**, Tajdîn shows a short message. Inside a playlist, group or other list it
skips to the next station that works.

## Finding stations

Tajdîn combines four sources (choose them in **Settings → General → Directories**):

- **Tajdîn Kurdish list**: hand-picked Kurdish stations, bundled with the extension.
- **[Radio Browser](https://www.radio-browser.info/)**: the open community directory, with
  50,000+ stations.
- **[SomaFM](https://somafm.com/)**: about 50 listener-supported, ad-free channels.
- **[laut.fm](https://laut.fm/)**: thousands of user-run music stations.

**Search** looks in station names and tags across all of them. Choose a language next to the search
box to narrow it down.

**Regex search** is for power users: click the `.*` button and type a regular expression, for
example `^radio\s+(kurd|roj)`. It's case-insensitive and supports Unicode. An invalid pattern is
outlined in red and not used.

**Languages**: pick **By language** in the list menu. Kurdish stations always show the curated list
first.

## Your library

### Favourites

Tap ♥ on any station and it's added to your favourites automatically. Open them with the **♥**
button in the popup, from the list menu, or in **Options → Favourites**, where you can also drag
them into the order they play in, play them all, or remove any with undo. Favourites work
offline, because Tajdîn keeps a copy of each station's details.

### Filter and sort any list

Every list (the random mix, search results, a language, favourites, playlists, groups and your
own stations) has a **filter box** and a **Sort & filter** menu:

- **Filter** by any word in the name, tags, country or language, by **language**, or by
  **source** (Kurdish list, Radio Browser, SomaFM, laut.fm, your stations).
- **Sort** by name (A–Z or Z–A), country, language, quality (highest bitrate first) or source.
  "Default order" keeps the list as it is, which for playlists and favourites is your order.
- Playing a station from a filtered list plays through just what you see.

In Options, dragging to reorder pauses while a sort or filter is on; reset them to reorder again.

### Playlists

Playlists keep their order and play through, skipping stations that are offline.

- Create one from the list menu, from a station's ⋮ menu (**Add to playlist → New playlist…**), or
  in **Options → Playlists**.
- In **Options → Playlists**, drag the ⋮⋮ handle to reorder (or focus it, press Space, then use the
  arrow keys). You can also use the ↑ ↓ buttons, remove stations, or search for stations to add.
- Deleting a playlist asks first, and **Undo** brings it back for a few seconds.

### Groups

Groups are collections for browsing.

- **Hand-picked group**: you choose the stations, for example "News".
- **Language group**: fills itself with **every station in a language**, for example a "Kurdish
  radio" group. Stations you add are pinned to the top.

### Your own stations

Got a stream that isn't in any directory? Click **+ → Add a station** (or **Options → My
stations**). Enter a name and the stream URL (`http://` or `https://`); a cover image, website,
language and tags are optional. Your stations work everywhere: search, favourites, playlists,
groups and shortcuts. If you close the popup mid-way, the form keeps what you typed for the rest of
the session.

## Play a link or a file

Click **+ → Play a link or file…**:

- **Paste a stream link** (MP3, AAC, Ogg, HLS `.m3u8`…) and press **Play**. Then **Save to my
  stations** if you want to keep it.
- **Choose an audio file** from your computer. It plays for this session only. Files are never
  saved, exported or uploaded anywhere.

## The desktop view and the website

The **desktop view** (🖥 in the popup) is a full-window player with a sidebar, a station grid and a
large player. It **starts playing as soon as it opens** (turn that off in **Settings → Playback**).

The same player runs on the web at **[0xdolan.github.io/tajdin](https://0xdolan.github.io/tajdin/)**.
Differences on the website:

- Your library is saved in that browser's site storage, separately from the extension. Use
  [backup](#backup-and-moving-to-another-browser) to move it across.
- Browsers ask for one click before a website may play sound, so you may see **Start listening**.
- Websites can't play `http://` streams. Tajdîn tries the `https://` address instead, and stations
  that still can't play are marked with a shield icon. The extension plays them all.
- Song information comes from SomaFM and laut.fm only.

## Settings

Open **⚙ Settings** from the popup.

| Section                                    | What's there                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **General**                                | Theme; what to open on; random-mix language; directories; default search mode; hide offline stations.  |
| **Playback**                               | Play when selected; autoplay in the desktop view; stream quality; song information; toolbar animation. |
| **Shortcuts**                              | Your keyboard shortcuts and a button to change them.                                                   |
| **My stations**, **Playlists**, **Groups** | Manage your library.                                                                                   |
| **Backup**                                 | Export and import.                                                                                     |
| **About**                                  | Version, links, credits.                                                                               |

Changes save immediately and apply to every open Tajdîn window.

## Keyboard shortcuts

**Anywhere in the browser** (even with the popup closed):

| Action           | Default                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Play / pause     | Media Play/Pause key                                                                              |
| Next station     | Media Next key                                                                                    |
| Previous station | Media Previous key                                                                                |
| Mute / unmute    | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>9</kbd> (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>9</kbd> on Mac) |
| Random station   | not set                                                                                           |
| Open Tajdîn      | not set                                                                                           |

Change them at `chrome://extensions/shortcuts` (Chrome, Edge, Brave) or **Add-ons → ⚙ → Manage
Extension Shortcuts** (Firefox), or click **Change shortcuts** in Settings.

**Inside the popup and desktop view:** <kbd>Space</kbd> play/pause · <kbd>N</kbd> next ·
<kbd>P</kbd> previous · <kbd>R</kbd> random · <kbd>M</kbd> mute · <kbd>↑</kbd>/<kbd>↓</kbd> volume.

## Backup, and moving to another browser

Tajdîn has no accounts and no servers, so your data lives only in this browser. Back it up
regularly.

**Export:** **Options → Backup → Download backup**. Choose which parts to include (settings,
favourites, playlists, groups, your stations). You get a `tajdin-backup-YYYY-MM-DD.json` file.

**Import:** **Choose backup file…**. Before anything changes, Tajdîn shows what's new, updated,
unchanged and only on this device. Then pick:

- **Merge**: adds what's new and updates matching items; nothing here is removed.
- **Replace**: makes the chosen sections exactly like the backup.

Backups work between the Chrome and Firefox extensions and the website, and backups from Tajdîn
0.0.x still import. Updating from 0.0.x moves your data over automatically.

## Questions

**Does Tajdîn track me?** No. There are no accounts, analytics or Tajdîn servers. Station
searches go to the directories and audio comes from each station's own server. See the
[privacy policy](./privacy-policy.md).

**A station doesn't play.** Stations go offline or change addresses; try another one. If a curated
Kurdish station is broken, please [open an issue](https://github.com/0xdolan/tajdin/issues).

**Can I suggest a Kurdish station?** Yes. Open an issue with its name and stream link, or send a
pull request (see [adding stations](https://github.com/0xdolan/tajdin/blob/main/docs/adding-stations.md)).

**Why does the website say "Start listening"?** Browsers don't let websites start sound without a
click. The extension's desktop view doesn't need it.
