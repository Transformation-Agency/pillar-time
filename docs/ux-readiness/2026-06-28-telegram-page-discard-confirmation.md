# UX Readiness Pass - 2026-06-28 - Telegram Page Discard Confirmation

## Area

Standalone Telegram page, advanced manual settings.

## Finding

P2 - The Telegram page could silently discard unsaved bot token, chat ID, allowed-user, or enable-setting edits when the user navigated away.

Settings connector modals already ask before throwing away unsaved Telegram setup text, but the full Telegram page did not have the same route-leave protection. That is risky because Telegram setup includes credentials and command-access controls.

## Fix

- Added a Telegram page baseline form state.
- Set a page-level dirty flag while manual Telegram setup differs from the saved baseline.
- Added a route-change confirmation before leaving the Telegram page with unsaved manual setup edits.
- Clear the dirty flag after a successful save or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type a Telegram token, click a different navigation item, cancel the discard prompt, confirm the Telegram page remains open, then repeat and accept the discard prompt.

