# UX Readiness Pass - 2026-06-28 - Reminder Draft Discard Confirmation

## Area

Reminders page, create-reminder form.

## Finding

P2 - A user could start creating a reminder, including body text, schedule, or delivery-channel choices, and lose the draft by navigating away before saving.

Reminder setup affects future nudges, so users need confidence that partially entered reminder rules will not disappear silently.

## Fix

- Added a create-reminder form baseline.
- Set a page-level dirty flag while the draft differs from the saved baseline.
- Added a route-change confirmation before leaving Reminders with unsaved title, body, schedule, or channel edits.
- Clear the dirty flag after successful reminder creation or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type a reminder title/body, change schedule details, navigate away, cancel the discard prompt, confirm the draft remains, then repeat and accept the discard prompt.

