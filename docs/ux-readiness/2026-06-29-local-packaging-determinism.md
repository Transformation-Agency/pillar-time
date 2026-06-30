# Local Packaging Determinism

## Finding

Severity: P1

Local desktop packaging could hang before the Rust build started. The Tauri CLI was spawning `npm list @tauri-apps/api version`, and the local npm install state plus user-level npm settings caused that package-inspection step to stall. That meant a developer could have a working installed app and green web build, but still lack reliable evidence that a fresh desktop package could be produced.

There was a second local-build trap: `tauri build` creates updater artifacts because `createUpdaterArtifacts` is enabled for release. Without the CI-only `TAURI_SIGNING_PRIVATE_KEY`, local builds can produce the app and DMG but exit at updater signing.

## Fix

- Declared `@tauri-apps/api` as a direct dependency because the frontend imports it directly.
- Added repo-level `.npmrc` settings:
  - `include=dev`, so local installs include the Tauri CLI even if a user has `omit=dev` globally.
  - `json=false`, so Tauri package inspection receives normal `npm list` output.
- Added `npm run desktop:build:local`, which disables updater artifact signing for local package testing.
- Added `scripts/sign-local-macos-app.mjs` to copy the generated macOS app to `/tmp/Pillar Time.local-build.app`, strip local metadata, ad-hoc sign it, and verify it for local install testing.

Release signing/notarization remains CI-owned through GitHub Actions and the existing Apple/Tauri updater secrets.

## Verification

- Clean manifest install in `/tmp` succeeded with `npm ci --ignore-scripts`.
- Clean repo install succeeded with `npm ci --ignore-scripts --include=dev`.
- `npm list @tauri-apps/api version` completed instead of hanging.
- `tauri info` completed instead of hanging.
- `npm run desktop:build -- --config '{"bundle":{"createUpdaterArtifacts":false}}'` produced:
  - `src-tauri/target/release/bundle/macos/Pillar Time.app`
  - `src-tauri/target/release/bundle/dmg/Pillar Time_0.2.5_aarch64.dmg`
- `npm run desktop:build:local` produced a metadata-clean, ad-hoc-signed app at `/tmp/Pillar Time.local-build.app` and verified it with `codesign`.
