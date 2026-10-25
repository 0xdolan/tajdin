# Security policy

## Supported versions

Only the latest release on the Chrome Web Store, Firefox Add-ons and GitHub Releases gets security
fixes.

## Reporting a vulnerability

Please **don't open a public issue**. Use GitHub's private
[security advisory form](https://github.com/0xdolan/tajdin/security/advisories/new) instead.
Include:

- what an attacker could do, and how (steps or a proof of concept);
- the affected version and browser;
- any suggested fix.

You'll get a reply within a week. Once a fix is released, you'll be credited unless you prefer not
to be.

## Scope

In scope: the extension, the website (`0xdolan.github.io/tajdin`), the build and release
workflows, and handling of data from directories, streams and backup files.

Out of scope: the third-party directories and stream servers themselves (Radio Browser, SomaFM,
laut.fm, stations); please report problems to them.

## Hardening already in place

Strict CSP (no remote scripts, no eval), minimal permissions, no content scripts, schema
validation of all stored, imported and fetched data, `http(s)`-only URLs, CodeQL and dependency
review in CI, and Dependabot updates.
