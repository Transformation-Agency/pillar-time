# UX Readiness Pass - 2026-06-27 - Brief Setup Save Error Detail

## Area

Brief Setup save flow.

## Finding

P2 - Brief Setup showed only `Save failed` when persistence failed.

Brief Setup controls the owner, voice, analyzers, and section structure for generated briefs. If saving fails, users need the actual backend/network error so they can tell whether this is a local backend issue, validation issue, or temporary failure.

## Fix

- Added `saveError` state.
- Clear the old error when the user edits or starts another save.
- Preserve the thrown error message when `/api/brief-config` fails.
- Render the detailed error under the page header without changing the layout.
- Added plain-English manual quick-start and "what goes where" guidance so first-run users have a lower-friction path into the app.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 40 tests.
- `npm test` - pass, 62 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Keep the source guard that prevents returning to the old `.catch(() => setSaveState("error"))` path.
- Add a rendered Brief Setup test later that forces a failed save and verifies the visible error text.
