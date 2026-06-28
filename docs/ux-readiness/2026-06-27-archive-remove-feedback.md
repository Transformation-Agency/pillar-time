# UX Readiness Pass - 2026-06-27 - Archive And Remove Feedback

## Area

Today commitments, Planner task backlog, and Reminder list.

## Finding

P2 - Confirmed remove/archive actions could fail without visible recovery feedback.

These actions already asked for confirmation, which helps prevent accidental changes. But after the user confirmed, the app fired direct mutations for:

- removing a commitment from Today's Three;
- archiving a Planner task;
- archiving a reminder.

If the backend request failed, the user could believe the item was removed from active planning when it was not.

## Fix

- Converted Today commitment removal to an async handler with success and failure copy.
- Converted Planner task archive to an async handler with success and failure copy.
- Converted Reminder archive to an async handler with success and failure copy.
- Reused each page's existing message area.
- Updated Reminder message styling so successful archive/pause/enable/disable messages are not shown as warnings.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Recommended Regression Tests

- Keep the source guards that prevent direct message-less remove/archive mutations.
- Add rendered interaction tests later for confirm-cancel, success, and backend-failure paths on Today, Planner, and Reminders.
