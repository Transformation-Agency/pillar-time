# UX Readiness: Google Calendar Fallback Errors

Date: 2026-06-27

## Finding

P2 - Google Calendar setup actions could show a blank warning when the backend returned an error without a message.

This affects a core permissions/account flow: starting OAuth, testing the connection, refreshing calendars, and saving selected calendars. A blank warning makes it harder for a real user to recover from OAuth, scope, or local backend problems.

## Fix

- Added fallback failure copy for starting Google Calendar OAuth.
- Added fallback failure copy for connection testing.
- Added fallback failure copy for calendar-list refresh.
- Added fallback failure copy for saving calendar selection.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 57 tests passed.
- `npm test` - pass, 79 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level recovery-copy guardrail. A packaged-app pass should still reconnect Google Calendar with real read/write scopes and verify OAuth browser handoff, callback, calendar selection, and approved calendar writes.
