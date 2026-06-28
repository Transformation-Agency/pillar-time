# UX Readiness Pass: Help Menu User Manual

## Surface

Header Help menu.

## Finding

- **P2: The plain-English user manual was not discoverable in the app.** The project had a simple user manual, but the desktop Help menu only exposed update actions. A first-run or stuck user had no obvious path from the app to the manual.

## Fix

- Added an `Open User Manual` menu item to the Help menu.
- The action opens the canonical GitHub manual URL through the existing external-link helper, so the current copyable-link fallback still works if the browser cannot open automatically.
- Left update actions unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This opens the GitHub-hosted manual. A later packaged-app pass should decide whether the manual should also be bundled locally for offline recovery.
