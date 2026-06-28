# UX Readiness: Today View Brief Disabled Reason

Date: 2026-06-27

## Finding

P3 - On a first run or clean profile, the Today page can show a disabled `View Brief` button without explaining why.

The user has not done anything wrong. They simply need to generate a day plan first. Without that explanation, the first screen can feel partially broken.

## Fix

- Added `viewBriefDisabledReason` in the Today page.
- The button now says why it is disabled: `Generate a day plan before viewing the brief`.
- Kept the existing flow unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 53 tests passed.
- `npm test` - pass, 75 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level guardrail and copy fix. A complete packaged-app pass should still verify the first-run Today screen visually with no prior workflow runs.
