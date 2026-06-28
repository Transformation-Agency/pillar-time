# UX Readiness Pass: Update Install Confirmation

## Surface

Desktop update install action in the Help menu and Settings.

## Finding

- **P2: Installing an update started immediately.** `Install Update` downloaded and staged a signed desktop update as soon as the user clicked it. That is install-adjacent behavior and should ask for explicit confirmation before starting network/download work.
- **P3: Update install failures could show blank copy.** The install failure path stored `error.message` directly in the visible message, so an empty thrown error could leave the user without recovery text.

## Fix

- Added a confirmation prompt before downloading and staging the signed desktop update.
- The prompt names the available version when known and explains that a restart will be requested after staging.
- Added fallback copy for update install failures.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 74 tests.
- `npm test` passed: 96 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This is a source-level guard. A packaged-app pass should still click through a real update install path and verify cancel, download progress, failure, installed, and restart states in the signed desktop app.
