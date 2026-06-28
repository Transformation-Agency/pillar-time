# Node sidecar runtime library packaging

- Status: fixed locally in the packaging script.
- Severity: P1.
- Surface: packaged macOS desktop app startup.

## Finding

The rebuilt `Pillar Time.app` could launch the shell process but the packaged backend sidecar failed before listening on port `42818`.

Crash evidence showed the backend binary required `@rpath/libnode.137.dylib`, but the app bundle did not include that runtime library. Manually copying `libnode.137.dylib` into the app bundle and re-signing allowed the backend to start.

## Fix

`scripts/prepare-tauri-sidecar.mjs` now:

- scans the copied Node sidecar with `otool -L`;
- copies the matching `libnode*.dylib` into `src-tauri/resources/lib`;
- adds an app-relative rpath for `@executable_path/../Resources/resources/lib`;
- includes `resources/lib` in the Tauri bundle resources;
- strips best-effort macOS metadata from copied bundle assets.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: passed, 81 tests.
- `npm run desktop:prepare`: passed and created `src-tauri/resources/lib/libnode.137.dylib`.
- `npm run desktop:build -- --bundles app`: built `Pillar Time.app`, then failed only at updater signing because `TAURI_SIGNING_PRIVATE_KEY` is not set locally.
- Installed `/Applications/Pillar Time.app` was replaced from the rebuilt bundle, metadata-cleared, ad-hoc signed, launched, and verified with:
  - backend sidecar process running from `/Applications/Pillar Time.app`;
  - port `127.0.0.1:42818` listening;
  - `/api/state` returning successfully.

## Remaining Release Warning

The local Homebrew Node binary still links several other Homebrew dylibs by absolute path. The immediate missing `libnode` blocker is fixed, but release candidates should either use a fully portable Node sidecar build or audit all non-system dylib references before notarized distribution.
