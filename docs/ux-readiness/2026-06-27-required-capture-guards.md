# UX Readiness Pass - 2026-06-27 - Required Capture Guards

## Area

Local capture forms across Today, Planner, Reminders, Meetings, and Documents.

## Finding

P3 - Several capture forms silently ignored empty required fields.

The backend and form handlers correctly rejected missing titles, dates, or body text, but several buttons stayed active even when the required input was blank. Clicking them could produce no visible result because the handler returned early. That makes first-run capture feel unreliable: the user clicks a button and the app appears to do nothing.

## Fix

- Disabled Today quick capture until a task or obligation is typed.
- Disabled Planner task creation until a task title is present.
- Disabled Planner important-date creation until title and start date are present.
- Disabled Reminder creation until a reminder title is present.
- Disabled Meeting save until a meeting title is present.
- Disabled Document creation until a document title is present.
- Added button titles that explain the missing input.
- Added regression guards for the visible disabled states.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 40 tests.
- `npm test` - pass, 62 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add rendered form tests later for Today, Planner, Reminders, Meetings, and Documents that verify each button enables as soon as the required input is entered.
