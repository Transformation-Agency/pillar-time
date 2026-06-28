# UX Readiness Pass - 2026-06-27 - Reminder Preference Feedback

## Area

Reminder preference switches.

## Finding

P2 - Reminder preference switches saved without visible success or failure feedback.

The Reminders page explains that reminders are gated by master switches and channel preferences. Those switches directly called the backend without a message path. If saving failed, the user could believe reminders or delivery channels were enabled when the app had not persisted that setting.

## Fix

- Converted reminder preference saves into an async feedback path.
- Clear stale feedback before each save.
- Show `<label> saved.` when a preference update succeeds.
- Show the backend error or `Could not update reminder settings.` when saving fails.
- Moved reminder feedback near the top of the Reminders page so preference, create, and row-action messages are visible without hunting.
- Added regression guards for master and channel preference saves.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 40 tests.
- `npm test` - pass, 62 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Reminders-page test later that mocks a failed `/api/time/preferences` patch and confirms the warning remains visible near the controls.
