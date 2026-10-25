# Store listing

Copy for the Chrome Web Store and Firefox Add-ons listings. Screenshots are in
`assets/store/` (1280×800) and `assets/screenshots/`.

## Name

Tajdîn: Internet Radio

## Summary (132 characters max)

Kurdish radio and 50,000+ stations worldwide in your toolbar. Plays in the background. No account,
nothing tracked.

## Description

Tajdîn is a radio player that stays by your side while you browse.

🎧 **Listen to the world**
• A hand-picked list of Kurdish stations, plus Radio Browser (50,000+ stations), SomaFM and laut.fm
• A fresh random mix every time you open it, or start on your favourites, a playlist, a group or a language
• Search by name or tag, filter by language, or use regular expressions

▶️ **A real player**
• Keeps playing when the popup closes
• Play/pause, next/previous, random, repeat (list or station, with automatic reconnect)
• Song titles from stations that send them (optional)
• Media keys and keyboard shortcuts that work anywhere in the browser
• The toolbar icon pulses while playing, so you always know

📚 **Your library**
• Favourites, ordered playlists that skip offline stations, and groups
• Language groups that gather every station in a language
• Add any stream URL as your own station, or play a link or an audio file once
• Full-window desktop view, also available on the web

🔒 **Private by design**
• No accounts, no analytics, no servers of ours: your data stays in your browser
• Export and import a JSON backup to move between browsers (Chrome ⇄ Firefox ⇄ web)

🌙 Light, dark and system themes · keyboard accessible · right-to-left station names

Open source: https://github.com/0xdolan/tajdin

## Category

Chrome: Entertainment · Firefox: Music & Audio (or "Other")

## Permission justifications (Chrome dashboard)

| Permission                                     | Justification                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                      | Saves the user's settings, favourites, playlists, groups and custom stations locally.                                                                                                                                                                                                          |
| `alarms`                                       | Keeps the background service worker responsive to media keys while a station is playing.                                                                                                                                                                                                       |
| `offscreen`                                    | Plays the radio stream in an offscreen document so audio continues after the popup closes (AUDIO_PLAYBACK).                                                                                                                                                                                    |
| Host permissions (`http://*/*`, `https://*/*`) | Radio streams and station logos are hosted on thousands of different servers chosen by users and directories; the extension must fetch station directories (Radio Browser, SomaFM, laut.fm) and play/read stream metadata from any host. No content scripts; pages are never read or modified. |

**Single purpose:** play internet radio stations.
**Remote code:** none. All code is bundled; no `eval`.
**Data usage:** no user data is collected or transmitted. Privacy policy:
https://github.com/0xdolan/tajdin/blob/main/docs/privacy-policy.md

## Notes for Firefox reviewers

- Built with WXT + Vite from the attached sources zip: `corepack enable && pnpm install --frozen-lockfile && pnpm build:extension`.
  The output is `apps/extension/.output/firefox-mv2/` and the zip is `apps/extension/.output/tajdin-<version>-firefox.zip`.
  Node 22+, pnpm 10.
- Manifest V2 with a persistent background page on purpose. The background page hosts the
  `<audio>` element, and MV3 event pages are suspended after ~30 s idle even while audio plays,
  which would cut the radio off.
- The `Function` constructor warnings come from Zod's capability probe
  (`try { Function('') } catch {}`). Tajdîn sets `z.config({ jitless: true })`, so it never runs.
- `innerHTML` warnings come from React DOM internals; Tajdîn never renders untrusted HTML.
- `data_collection_permissions: none`: nothing is collected.
