# UX Readiness Pass: Google Calendar Save Disabled Reason

## Finding

- **P3: Calendar selection save could be a no-op.** In Google Calendar setup, `Save calendars` was available even when the user had not changed the selected calendars. That creates a small dead-end state because clicking it appears to do work but cannot change anything.

## Fix

- Disabled `Save calendars` until the calendar selection is dirty.
- Added a hover title explaining: `Change selected calendars before saving`.
- Preserved the existing save behavior once a real selection change exists.

## Guardrail

- Updated the Google Calendar runtime guardrail to require the disabled reason and save title.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
