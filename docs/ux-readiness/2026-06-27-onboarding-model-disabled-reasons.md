# UX Readiness: Onboarding Model Disabled Reasons

Date: 2026-06-27

## Finding

P3 - In first-run onboarding, the optional model-provider step had disabled actions that did not explain the recovery path.

When `Validate key` was busy or `Save model` had no model name, the user only saw a disabled button. A model save failure could also show a blank warning if the backend error did not include a message.

## Fix

- Added explicit disabled-reason strings for model validation and model saving.
- Added button titles that explain what the user is waiting on or what input is missing.
- Added a fallback save-failure message: `Could not save model settings.`

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 50 tests passed.
- `npm test` - pass, 72 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This fix covers the source-level copy and guardrails. A packaged-app pass should still verify keyboard focus order and hover/title behavior in the actual Tauri WebView.
