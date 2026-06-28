# UX Readiness Pass: Reminder Enable Confirmation

## Surface

Reminders page, individual reminder row actions.

## Finding

- **P2: Individual reminders could be enabled with one click.** Master reminders already require confirmation, but an individual disabled reminder could still be turned on immediately. If Master reminders are also on, that can schedule future desktop or Telegram nudges.

## Fix

- Added a `toggleReminder` helper for reminder row enable/disable.
- Enabling a disabled reminder now asks for confirmation and explains that future desktop or Telegram nudges may be scheduled when Master reminders are on.
- Disabling a reminder remains one click because it turns nudges off.
- Pause and archive behavior are unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 74 tests.
- `npm test` passed: 96 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This is source-guarded. A rendered UI pass should still verify cancel/confirm behavior with Master reminders on and off.
