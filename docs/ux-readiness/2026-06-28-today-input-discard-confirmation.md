# Today Input Discard Confirmation - 2026-06-28

## Finding

P2 - The Today screen accepted high-value first-run input in Quick Capture and Context Intake, but a user could navigate away before saving and lose typed text without warning.

This was especially risky because Context Intake is where users may paste identity statements, standing commitments, running to-do lists, or missing day-plan context. Losing that text makes the app feel less trustworthy at exactly the moment it is supposed to reduce mental clutter.

## Fix

- Added a Today unsaved-input flag that tracks Quick Capture text and Context Intake text.
- Added a route-change confirmation before leaving Today when either input has unsaved text.
- Kept the fix local to the existing route guard pattern used by other edit-heavy screens.
- Expanded the user manual with a simple "Read This First" path, Today button explanations, and guidance for where to put loose context.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is covered by source-level runtime guard tests. A later browser pass should still confirm the native confirm dialog appears when leaving Today after typing into both fields.
