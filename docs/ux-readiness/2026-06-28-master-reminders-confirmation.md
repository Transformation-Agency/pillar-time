# UX Readiness Pass: Master Reminders Confirmation

## Finding

- **P2: Master reminders could be enabled with one click.** Pillar Time correctly keeps reminders off by default, but enabling the master gate can allow future desktop or Telegram nudges once individual reminders are enabled. That deserves explicit user intent.

## Fix

- Added confirmation before turning on Master reminders.
- The confirmation explains that enabled reminders may start sending future desktop or Telegram nudges.
- Turning Master reminders off remains immediate because it reduces notification activity.

## Guardrail

- Updated the reminder runtime guardrail to require the Master reminders enable confirmation.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
