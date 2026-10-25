# Releasing

Tajdîn follows **gitflow** and **semantic versioning**. A version tag on `main` triggers one
workflow, which builds once, then publishes everywhere from the same zips:

```
feature/* ──▶ develop ──▶ release/x.y.z ──▶ main ──tag vX.Y.Z──▶ Release workflow
                 ▲                            │                  ├─ GitHub Release (Chrome, Firefox, sources zips + SHA256SUMS)
                 └──────── merged back ───────┘                  ├─ Chrome Web Store (upload + submit for review)
                                                                 └─ Firefox Add-ons (upload + sources + submit)
main ──push──▶ Website workflow ──▶ GitHub Pages
```

## Branches

| Branch           | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `main`           | What's released. Every commit on it is a tagged version.     |
| `develop`        | Integration branch; pull requests go here.                   |
| `feature/<name>` | New work, from `develop`.                                    |
| `release/x.y.z`  | Stabilising a release: version bump, changelog, final fixes. |
| `hotfix/x.y.z`   | Urgent fix, from `main`, merged into `main` and `develop`.   |

## Versions

`MAJOR.MINOR.PATCH`, one version for the whole repo. The extension manifest takes it from
`apps/extension/package.json`, and `pnpm version:bump` sets it in every package.

- **patch**: fixes, station list updates.
- **minor**: new features, backwards-compatible data.
- **major**: breaking changes to stored data or the backup format.

## Cutting a release

```bash
git switch develop && git pull
pnpm release:start minor        # creates release/x.y.z, bumps versions, prepends CHANGELOG.md
# Edit the new CHANGELOG.md section: it becomes the GitHub release notes, so write it for users.
pnpm build:extension && pnpm verify:release   # try the zips (load them unpacked)
git commit -am "docs(changelog): polish x.y.z notes"
pnpm release:finish             # runs checks, merges into main, tags vX.Y.Z, merges back into develop
git push origin main develop vX.Y.Z
```

Pushing the tag starts **Release** in GitHub Actions. With required reviewers on the `stores`
environment, store submission waits for your approval in the Actions tab.

**Hotfix:** `git switch -c hotfix/x.y.z main`, fix, `pnpm version:bump patch`, update
CHANGELOG.md, commit, then `pnpm release:finish`.

**Check store credentials** without uploading: Actions → Release → Run workflow (branch `develop`)
→ tick _Only check the store credentials_. Each configured store signs in and reports success.

**Re-run store submission** without a new tag: Actions → Release → Run workflow → tick _Submit to
the stores_.

## One-time setup

### GitHub repository

1. **Settings → Pages → Source: GitHub Actions.** The site deploys from `main` to
   `https://0xdolan.github.io/tajdin/`.
2. **Settings → Environments → New environment `stores`.** Optionally add yourself as a required
   reviewer so every store submission needs a click. Add the secrets below to this environment.
3. **Settings → Branches:** protect `main` and `develop` (require pull requests and the CI checks).
4. Optional: set the repository's website to `https://0xdolan.github.io/tajdin/`, and add topics
   such as `radio`, `kurdish`, `browser-extension` and `chrome-extension`.

### Chrome Web Store (existing listing `igldoeednndfkhmigohfblmlppmphock`)

Tajdîn uses the Chrome Web Store API v2 with a **service account**, Google's current recommended
method:

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or pick) a project and
   enable the **Chrome Web Store API**.
2. **IAM & Admin → Service accounts → Create service account.** Then **Keys → Add key → JSON** and
   download it.
3. In the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole) →
   **Account**, copy your **Publisher ID** and add the service account's email under **Service
   accounts** (API access).
4. Add the secrets to the `stores` environment:

| Secret                                | Value                                                 |
| ------------------------------------- | ----------------------------------------------------- |
| `CHROME_PUBLISHER_ID`                 | Publisher ID from the dashboard                       |
| `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | `client_email` from the JSON key                      |
| `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`  | `private_key` from the JSON key (the whole PEM block) |

The extension ID is already set in `.github/workflows/release.yml`.

### Firefox Add-ons

1. Sign in at [addons.mozilla.org](https://addons.mozilla.org/developers/). For the **first**
   version, submit `tajdin-<version>-firefox.zip` by hand with the sources zip (upload the source
   code when asked) and the listing text from [store-listing.md](./store-listing.md). The add-on ID
   is fixed in the manifest: `tajdin@0xdolan.github.io`.
2. Create API credentials at **Tools → Manage API Keys**.
3. Add the secrets to the `stores` environment:

| Secret               | Value                   |
| -------------------- | ----------------------- |
| `FIREFOX_JWT_ISSUER` | "JWT issuer" (`user:…`) |
| `FIREFOX_JWT_SECRET` | "JWT secret"            |

From then on, every tag uploads a new version and its sources automatically.

If a store's secrets are missing, the workflow skips that store with a warning; the GitHub Release
is still published.

### Checking credentials locally (optional)

```bash
cd apps/extension
pnpm exec wxt submit init      # interactive; writes .env.submit (git-ignored)
pnpm build:extension
pnpm exec wxt submit --dry-run --chrome-zip .output/tajdin-*-chrome.zip \
  --firefox-zip .output/tajdin-*-firefox.zip --firefox-sources-zip .output/tajdin-*-sources.zip
```

## What a release contains

| File                       | For                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `tajdin-x.y.z-chrome.zip`  | Chrome Web Store, or "Load unpacked" after unzipping                                    |
| `tajdin-x.y.z-firefox.zip` | Firefox Add-ons, or `about:debugging` temporary install                                 |
| `tajdin-x.y.z-sources.zip` | Full source for reviewers and anyone rebuilding: `pnpm install && pnpm build:extension` |
| `SHA256SUMS.txt`           | Checksums                                                                               |
