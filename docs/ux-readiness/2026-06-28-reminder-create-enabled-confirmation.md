# UX Readiness Pass: Reminder Create Enabled Confirmation

## Surface

Reminders page, create reminder form.

## Finding

- **P2: New reminders could be created enabled immediately without confirmation.** Existing reminders now ask before enabling, but the create form still allowed `Enable immediately` to submit directly. If Master reminders are on, that can schedule future desktop or Telegram nudges.

## Fix

- Added a confirmation when creating a reminder with `Enable immediately` checked.
- The prompt names the reminder and explains that future desktop or Telegram nudges may be scheduled when Master reminders are on.
- Creating a disabled reminder remains unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 74 tests.
- `npm test` passed: 96 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This is source-guarded. A rendered UI pass should verify cancellation keeps the form intact and does not create the reminder.
