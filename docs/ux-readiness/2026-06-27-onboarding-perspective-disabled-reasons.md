# UX Readiness: Onboarding Perspective Disabled Reasons

Date: 2026-06-27

## Finding

P3 - In first-run onboarding, the optional perspective-lens step could show disabled `Generate lenses` or `Save and continue` actions without explaining why.

This matters because perspective setup is an optional, model-assisted feature. A new user may not know whether the app is waiting on more text, an in-progress generation, or a generated draft. Silent disabled buttons make the onboarding flow feel stuck even when the fix is simple.

## Fix

- Added explicit disabled-reason strings for perspective generation and saving.
- Attached those reasons as button titles.
- Kept the flow unchanged: users can still skip perspective setup and continue.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 49 tests passed.
- `npm test` - pass, 71 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level guardrail and copy fix. A future visual pass should still test the complete onboarding path in the packaged app with keyboard navigation.
