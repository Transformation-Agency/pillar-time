# UX Readiness Pass - 2026-06-27 - Reminder List Feedback

## Area

Reminders page.

## Finding

P2 - Reminder row actions had no local success or failure message.

Creating reminders already showed feedback, but enabling, disabling, and pausing existing reminders called the backend directly from the row buttons. If those saves failed, the page gave no clear recovery clue. Since reminders are intentionally quiet-by-default and gated, users need visible confirmation when they turn a nudge on, off, or pause it.

## Fix

- Added a shared async `updateReminder` handler.
- Reminder `Enable` / `Disable` now shows `<reminder title> enabled.` or `<reminder title> disabled.`
- Reminder `Pause` now shows `<reminder title> paused until tomorrow.`
- Failed row updates show the backend error or `Could not update reminder.`

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44036/#reminders`
- Data directory: `/tmp/pillar-time-ux-reminders-20260627`
- Command: `PORT=44036 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-reminders-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Reminders page rendered.
- Created a disposable reminder.
- Clicking `Enable` produced visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less reminder row mutations.
- Add a rendered Reminders-page test later that mocks a failed `/api/time/reminders/:id` patch and asserts the warning text appears.
- Add a keyboard-only pass for reminder create, enable, pause, and archive.
