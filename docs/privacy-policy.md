# Tajdîn privacy policy

**Last updated:** 25 October 2026 (version 0.1.1)

Tajdîn is a radio player for Chrome, Firefox and the web. It is open source:
[github.com/0xdolan/tajdin](https://github.com/0xdolan/tajdin).

## In short

Tajdîn has **no accounts, no analytics, no telemetry and no servers of its own**. We (the
developers) receive nothing about you. Everything you save stays in your browser.

## What stays on your device

Tajdîn saves the following in your browser's extension storage (or, on the website, the site's
local storage):

- settings (theme, start screen, playback and search preferences);
- favourites, playlists, groups and the stations you added, plus a copy of those stations' public
  details (name, stream link, logo link) so your library works offline;
- for the current browser session only: what's playing, the play queue and your search text.

Local audio files you choose are played from memory for the current session. They are **never
stored, exported or uploaded**.

You can export this data (Options → Backup), and remove it by uninstalling Tajdîn or clearing the
site's data.

## Network requests

Tajdîn connects only to the services needed to find and play stations. Each one sees your IP
address like any website you visit:

| Service                                                                       | Why                                                                                                                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Radio Browser](https://www.radio-browser.info/) (`*.api.radio-browser.info`) | Station search and details. When you play one of its stations, Tajdîn tells Radio Browser (anonymously) so it can rank popular stations, as its API asks. |
| [SomaFM](https://somafm.com/) (`somafm.com`, `api.somafm.com`)                | Channel list and, if you turn it on, the current song.                                                                                                    |
| [laut.fm](https://laut.fm/) (`api.laut.fm`)                                   | Station search and, if you turn it on, the current song.                                                                                                  |
| Each station's stream and logo server                                         | The audio you play and the station's logo.                                                                                                                |
| GitHub Pages (website only)                                                   | Serves the website files.                                                                                                                                 |

If you turn on **Show what's playing**, the extension briefly connects to the station's stream to
read the song title the station broadcasts.

Their handling of requests is governed by their own policies.

## Permissions (extension)

| Permission                     | Why                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                      | Save your settings and library on your device.                                                                                                  |
| `alarms`                       | Keep keyboard shortcuts responsive while a station plays.                                                                                       |
| `offscreen` (Chrome)           | Play audio after the popup closes.                                                                                                              |
| Access to all http/https sites | Stations stream from thousands of different servers, and the directories must be reachable. Tajdîn does not read or change the pages you visit. |

Tajdîn has no content scripts and never accesses your tabs, history or page contents.

## Children

Tajdîn is not directed at children and collects no personal information from anyone.

## Changes

If Tajdîn's behaviour changes, this page will be updated, along with the date above.

## Contact

Questions or concerns: [open an issue](https://github.com/0xdolan/tajdin/issues). For security
reports, see [SECURITY.md](https://github.com/0xdolan/tajdin/blob/main/SECURITY.md).
