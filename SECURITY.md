# Security

## Reporting vulnerabilities

Please report security issues **privately** (do not open a public issue). Contact the maintainers with a description, affected versions, and reproduction steps if possible. We will acknowledge receipt and work on a fix and disclosure timeline.

## Project practices

- Dependencies: lockfile + automated audits (`npm audit`, Dependabot, dependency review on pull requests).
- Extension: Manifest V3, least privilege, CSP, and strict validation of user-supplied data (including imported JSON).
- Secrets: never commit `.env`, API keys, or credential-bearing editor config (e.g. `.cursor/mcp.json`).

## Supported versions

Security fixes are applied to the active development line on `develop` and released through `main` following the project’s Git Flow policy.
