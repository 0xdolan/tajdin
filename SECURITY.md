# Security

## Reporting vulnerabilities

Please report security issues **privately** (do not open a public issue). Contact the maintainers with a description, affected versions, and reproduction steps if possible. We will acknowledge receipt and work on a fix and disclosure timeline.

## Project practices

- **Dependencies** — Lockfile (`package-lock.json`), `npm audit` locally, **CI** runs `npm audit --audit-level=high`, Dependabot, and **dependency review** on pull requests.
- **Extension** — Manifest V3, **content_security_policy** on extension pages (`script-src 'self'`, no `unsafe-eval`; enforced in `scripts/verify-extension.mjs`), and **least-privilege** permissions: `storage`, `alarms`, `offscreen`, `clipboardWrite`, plus broad **host** access only where required for **Radio Browser API** and arbitrary **stream URLs** in the offscreen `<audio>` element.
- **User data** — Imported backup JSON is validated with **Zod** (`backup-schema.ts` / `TajdinBackupFileSchema`) before merge or replace. Treat pasted or imported JSON as untrusted until validation passes.
- **Network** — Station metadata comes from the public Radio Browser API; **streams** are user-chosen URLs; do not assume every stream endpoint is trustworthy.
- **Secrets** — Never commit `.env`, API keys, or credential-bearing editor config (e.g. `.cursor/mcp.json`). The repo’s **`.env.example`** documents optional keys for **Task Master** / local tooling; it is **not** required to build or run the extension.

## Supported versions

Security fixes are applied to the active development line on `develop` and released through `main` following the project’s Git Flow policy.
