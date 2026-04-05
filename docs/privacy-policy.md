# Tajdîn — Privacy policy

**Last updated:** April 2025  

**Extension:** Tajdîn (Chrome extension, Manifest V3)  
**Source:** [github.com/0xdolan/tajdin](https://github.com/0xdolan/tajdin)

## Summary

Tajdîn does **not** operate its own servers for the extension and does **not** collect, store, or sell personally identifiable information for advertising or analytics. Data needed for the product (favourites, playlists, settings) is kept **on your device** using Chrome’s extension storage APIs.

## What we (the developers) collect

We **do not** intentionally collect any of the following through Tajdîn:

- Name, email, postal address, or government ID  
- Health or financial information  
- Passwords or authentication secrets for Tajdîn (the extension has no Tajdîn user account)  
- Your emails, texts, or chats  
- Your browsing history or the text/content of web pages you visit  
- Precise GPS location  
- Keystrokes, mouse positions, or scroll analytics  
- Payment information  

There is **no** Tajdîn-run analytics or telemetry in the distributed extension package.

## What stays on your device

The extension uses **Chrome `storage`** APIs to save, locally on your computer:

- Settings (for example theme, popup size, search defaults)  
- Favourite station identifiers  
- Playlists and custom station entries you create  
- Short-lived session data for the player (for example current station, volume)  

You can export or delete this data using the extension’s **Backup** options where provided, or by removing the extension / clearing extension data in Chrome.

## Network and third parties

When you use Tajdîn:

- **Radio Browser** (public API at `radio-browser.info` and related hosts) receives requests for station **metadata** (names, tags, stream URLs, etc.). Those requests are made **from your device** like any other HTTPS client. Radio Browser’s handling of requests is governed by their policies, not ours.  
- **Stream operators** receive requests when you play a station; their servers deliver audio. We do not control those operators.  
- Your **IP address** may be visible to those third-party servers as part of normal internet routing; **we do not receive a separate copy** of that data because we do not run the extension’s backend.

The extension may use **`clipboardWrite`** only when you explicitly choose an action to **copy** content (for example a station URL) to the clipboard.

## Children

Tajdîn is not directed at children under 13, and we do not knowingly collect personal information from children.

## Changes

We may update this policy if the extension’s behaviour changes. The **Last updated** date and the GitHub repository will reflect the current version.

## Contact

- **Issues & support:** [github.com/0xdolan/tajdin/issues](https://github.com/0xdolan/tajdin/issues)  
- For private security reports, see the **SECURITY.md** file in the [repository root](https://github.com/0xdolan/tajdin).
