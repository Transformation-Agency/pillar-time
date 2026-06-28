# UX Readiness: Telegram Pairing Disabled Reason

Date: 2026-06-27

## Finding

P3 - Telegram first-run pairing could leave the primary `Create pairing link` action disabled without explaining the next step.

When no BotFather token is present, the user needs a clear recovery instruction on the blocked action itself. Pairing poll/start failures could also show blank warnings if an API error lacked a message.

## Fix

- Added `pairingDisabledReason` for busy and missing-token states.
- Added a button title with the recovery instruction.
- Added fallback messages for pairing-status polling and pairing-link creation errors.

## Runtime Smoke

- Started the app locally on isolated port `43996`.
- Served `GET /` successfully.
- Confirmed `/api/state` responded successfully from a temporary SQLite data directory.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 54 tests passed.
- `npm test` - pass, 76 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This pass did not perform a real Telegram BotFather pairing. A packaged-app acceptance pass should still pair a real bot, expire a code, and verify the recovery copy in the Tauri WebView.
