# Releasing

Tajdîn uses **one working branch, `main`**, and **semantic versioning**. Every change reaches
`main` through a pull request that merges itself once CI passes. A version tag on `main` triggers
one workflow, which builds once, then publishes everywhere from the same zips:

```
fix/* feature/* ──PR, auto-merge──▶ main ──tag vX.Y.Z──▶ Release workflow
                                     │                   ├─ GitHub Release (Chrome, Firefox, sources zips + SHA256SUMS)
                                     │                   ├─ Chrome Web Store (upload + submit for review)
                                     │                   ├─ Firefox Add-ons (upload + sources + submit)
                                     │                   └─ Website (GitHub Pages)
                                     └──Sync develop──▶ develop (same commit as main)
```

## Branches

| Branch                         | Purpose                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `main`                         | The default and only working branch. Protected: changes arrive only by pull request with CI.   |
| `fix/<name>`, `feature/<name>` | Short-lived work from `main`. `pnpm pr` opens the PR with auto-merge; GitHub deletes it after. |
| `release/x.y.z`                | Version bump and changelog only, made and merged by `pnpm release:*`.                          |
| `develop`                      | Read-only mirror of `main`, moved by the **Sync develop** workflow. Never push or target it.   |

These rules keep the repository tidy without any manual merging:

- No open pull requests are left behind: auto-merge merges each one when CI is green, and a red
  one is fixed on its branch (push again) or closed.
- No stale branches: _Automatically delete head branches_ is on.
- No "had recent pushes" banners: you only push short-lived branches that already have a PR, and
  `develop` is updated by the github-actions bot.
- No back-merges: `develop` isn't a separate line of work, so it can't fall behind.

## Versions

`MAJOR.MINOR.PATCH`, one version for the whole repo. The extension manifest takes it from
`apps/extension/package.json`, and `pnpm version:bump` sets it in every package.

- **patch**: fixes, station list updates.
- **minor**: new features, backwards-compatible data.
- **major**: breaking changes to stored data or the backup format.

## Cutting a release

```bash
pnpm release:start minor        # from main: creates release/x.y.z, bumps versions, prepends CHANGELOG.md
# Edit the new CHANGELOG.md section: it becomes the GitHub release notes, so write it for users.
pnpm build:extension && pnpm verify:release   # try the zips (load them unpacked)
git commit -am "docs(changelog): polish x.y.z notes"
pnpm release:finish
```

`release:finish` does the rest, entirely through a pull request:

1. runs `pnpm check`, pushes `release/x.y.z` and opens the release PR into `main`;
2. waits for CI, merges it (deleting the branch) and tags the merge commit `vX.Y.Z`.

Pushing the tag starts **Release** (GitHub Release, then both stores) and **Website** in GitHub
Actions. The merge into `main` also runs **Sync develop**. With required reviewers on the `stores`
environment, store submission waits for your approval in the Actions tab.

**Urgent fix:** the same as any change: `git switch -c fix/<name> main`, commit, `pnpm pr`; once it
has merged, `pnpm release:start patch` and `pnpm release:finish`.

**Check store credentials** without uploading: Actions → Release → Run workflow (branch `main`)
→ tick _Only check the store credentials_. Each configured store signs in and reports success.

**Re-run store submission** without a new tag: Actions → Release → Run workflow → tick _Submit to
the stores_.

## One-time setup

### GitHub repository

1. **Settings → Pages → Source: GitHub Actions.** The site deploys from `main` to
   `https://0xdolan.github.io/tajdin/`.
2. **Settings → Environments → New environment `stores`.** Optionally add yourself as a required
   reviewer so every store submission needs a click. Add the secrets below to this environment.
3. **Settings → General → Pull Requests:** allow auto-merge and _Automatically delete head
   branches_. **Settings → Rules → Rulesets:** a ruleset for `main` that requires a pull request
   and the CI checks, and blocks force pushes and deletion. A second ruleset for `develop` only
   blocks deletion, so the **Sync develop** workflow can still move it. **Settings → Environments → github-pages:** allow
   deployments from `main` and from tags `v*.*.*`.
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
