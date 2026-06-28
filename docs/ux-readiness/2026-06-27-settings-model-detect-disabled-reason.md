# UX Readiness: Settings Model Detection Disabled Reason

Date: 2026-06-27

## Finding

P3 - The Settings model-provider modal could disable `Detect models` while detection was running without explaining why.

Onboarding already explained this state, but Settings did not. Since model setup is one of the most common recovery paths after a failed brief, the modal should make busy and failure states clear.

## Fix

- Added `settingsModelDetectDisabledReason`.
- Added a button title that explains model detection is already running.
- Added a fallback message when model detection fails without a backend error message.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 56 tests passed.
- `npm test` - pass, 78 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level guardrail and copy fix. A packaged-app pass should still configure a real model provider, run detection, and confirm the Settings modal is understandable while detection is busy and after a failed API call.
