# UX Readiness Pass - 2026-06-27 - Brief Setup Section Copy

## Area

Brief Setup structure builder.

## Finding

P3 - Brief Setup exposed disabled section actions that looked like real tools.

The section row showed a disabled `Copy` button labeled "not available yet" and a disabled `Edit` button even though the title and prompt are already editable inline. In a production setup flow, disabled fake actions create a small dead-end: users can see the affordance but cannot complete the obvious action.

## Fix

- Made `Copy` duplicate the selected section immediately after the source section.
- Gave copied sections a fresh key and a clear `Copy` suffix.
- Removed the disabled `Edit` button because editing already happens inline.
- Updated the runtime separation guard so "not available yet" copy cannot come back unnoticed.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 40 tests.
- `npm test` - pass, 62 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Brief Setup interaction test later that clicks Copy and verifies a duplicate section appears below the original with editable title and prompt fields.
