# Releasing Pillar Time

How to cut a new desktop release (signed/notarized macOS DMGs + signed Windows installer + auto-updater manifest).

The whole pipeline is **triggered by pushing a git tag** named `vX.Y.Z`. You do not run any build commands by hand — GitHub Actions does the signing, notarization, and publishing.

---

## TL;DR

```bash
# 1. Land your changes on main (via a normal branch + PR + merge).

# 2. On main, bump the version in all four files (see table) and add release notes.
git checkout main && git pull

# 3. Commit the version bump + notes (PR or direct to main), then:
git tag v0.1.8           # tag name MUST be "v" + the exact version you set
git push origin v0.1.8   # <-- this fires the release

# 4. Watch the runs, then verify the GitHub release has assets + latest.json.
```

The version in the tag **must** match the version in `package.json`. The publish job derives the version from the tag name (`v0.1.8` → `0.1.8`).

---

## Step 1 — Land your code changes first

Make changes the normal way: branch off `main`, open a PR, get it reviewed, merge. Don't bundle unrelated code changes into the version-bump commit.

## Step 2 — Bump the version (all four files must match)

Use semantic versioning. For a normal bug-fix release, increment the patch number (`0.1.7` → `0.1.8`). Update **every** file below to the **same** version:

| File | What to change |
|------|----------------|
| `package.json` | `"version": "0.1.8"` |
| `src-tauri/tauri.conf.json` | `"version": "0.1.8"` |
| `src-tauri/Cargo.toml` | `version = "0.1.8"` (under `[package]`) |
| `src-tauri/Cargo.lock` | the `version = "0.1.8"` line under `name = "pillar-time"` |

> All four must agree. The app version (shown in-app and used by the auto-updater to compare) comes from `tauri.conf.json`; the release **asset names** come from `package.json`. A mismatch produces a broken or unverifiable release.

Quick check after editing:

```bash
node -p 'require("./package.json").version'
grep -m1 '"version"' src-tauri/tauri.conf.json
grep -m1 '^version' src-tauri/Cargo.toml
```

## Step 3 — Write release notes

Create `docs/release-notes/vX.Y.Z.md` (filename must match the tag exactly, e.g. `docs/release-notes/v0.1.8.md`). This file becomes the **GitHub Release body**. Keep the existing format:

```markdown
# Pillar Time v0.1.8

One-line summary.

## Fixes
- ...

## Downloads
- Apple Silicon Mac: `Pillar.Time_0.1.8_aarch64.dmg`
- Intel Mac: `Pillar.Time_0.1.8_x64.dmg`
- Windows: `Pillar.Time_0.1.8_x64-setup.exe`
```

If the notes file is missing, the workflow falls back to a generic body — so always add it.

## Step 4 — Get the bump + notes onto `main`

Commit Steps 2–3 (via a PR, or directly to `main` if that's your convention) and make sure `main` is updated locally:

```bash
git checkout main && git pull
node -p 'require("./package.json").version'   # confirm it's the new version
```

## Step 5 — Tag and push (this fires the release)

```bash
git tag v0.1.8
git push origin v0.1.8
```

Pushing the `v*` tag triggers three workflows in parallel:

- **macOS notarized release** — builds + signs + notarizes Apple Silicon and Intel DMGs, plus updater artifacts.
- **Windows build** — builds + signs the installer via Azure Trusted Signing.
- **Publish updater manifest** — waits for all platform assets, then generates and uploads `latest.json`.

## Step 6 — Verify

```bash
# Watch the runs
gh run list --repo Transformation-Agency/pillar-time --event push --limit 5

# When green, confirm the release + assets
gh release view v0.1.8 --repo Transformation-Agency/pillar-time --json assets -q '.assets[].name'
```

A healthy release has: both mac DMGs, the Windows `-setup.exe`, the updater `.app.tar.gz`/`.exe` + matching `.sig` files, `.sha256` files, and **`latest.json`** listing all three platforms (`darwin-aarch64`, `darwin-x86_64`, `windows-x86_64`) each with a signature. Existing installs auto-update by reading `latest.json` from the latest release.

---

## Testing locally before you release (optional but recommended)

```bash
npm install
npm run desktop:prepare   # builds the frontend + bundles the Node/whisper sidecars
npm run tauri dev         # or: node_modules/.bin/tauri dev  — launches the native app

# Quick web-only iteration on the backend (no native shell):
npm run dev               # serves the app at http://127.0.0.1:42818
```

---

## Gotchas / rules

- **Tag = `v` + exact `package.json` version.** `v0.1.8` for version `0.1.8`. Mismatches break the publish job.
- **Keep all four version files in sync** (Step 2). The most common mistake is forgetting `Cargo.lock`.
- **Never change the Tauri updater signing key or `updater.pubkey`** in `tauri.conf.json` unless you intend to. Builds are signed with `TAURI_SIGNING_PRIVATE_KEY` (a GitHub secret) and verified against the baked-in `pubkey`; changing one without the other means existing users can't auto-update.
- **Editing anything under `.github/workflows/` requires a GitHub token with the `workflow` scope.** If a push is rejected with "refusing to allow an OAuth App to create or update workflow…", run `gh auth refresh -h github.com -s workflow` (and approve in the browser with the *same* account `gh` is logged in as).
- **Asset names are `Pillar.Time_*`.** Don't reintroduce `Pillar.Brief` naming if you copy workflow snippets from the Brief repo.
- **Backend port is `42818`** (`src-tauri/src/lib.rs`), deliberately different from Pillar Brief's `42817` so both apps can run at once. Don't change it back.
- **Secrets are already configured** in the repo (Apple signing/notarization, Azure Trusted Signing, Tauri updater key). You don't need to set anything to release. If a signing step ever fails, check the corresponding `Settings → Secrets and variables → Actions` entries.
- **Re-running a release for the same version:** delete the tag and release first (`git push --delete origin v0.1.8`, then delete the GitHub release), or bump to a new patch version. Tags are not meant to be moved.

---

## Workflow files (for reference)

- `.github/workflows/macos-release.yml`
- `.github/workflows/windows-build.yml`
- `.github/workflows/publish-updater-manifest.yml`
- `scripts/generate-updater-manifest.mjs` (builds `latest.json`)
