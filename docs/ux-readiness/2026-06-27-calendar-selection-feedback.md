# UX Readiness Pass - 2026-06-27 - Calendar Selection Feedback

## Area

Settings > Google Calendar connector modal, selected calendar checkboxes.

## Finding

P3 - Removing the final selected calendar silently did nothing.

Pillar Time must keep at least one Google Calendar selected for day planning. The modal enforced that rule by returning the current selection when the user unchecked the last selected calendar, but it did not explain why the click had no effect. It also marked the selection dirty even though no actual change happened.

## Change

- Shows `Keep at least one calendar selected for daily planning.` when the user tries to remove the final selected calendar.
- Avoids marking the calendar selection dirty when that blocked action does not change anything.
- Clears the message when the user makes a valid calendar selection change.
- Added a runtime-separation guard for the minimum-selection behavior.

## Why This Matters

Calendar selection controls which calendars shape the day plan. If the app ignores a checkbox click with no explanation, users may think the modal is broken or that their calendar preferences are not trustworthy. A one-line message keeps the rule clear.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 46 passed.
- `npm test` - pass, 68 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified. A future packaged-app visual pass should check that the message appears close enough to the calendar list to be noticed without pushing modal controls out of view.
