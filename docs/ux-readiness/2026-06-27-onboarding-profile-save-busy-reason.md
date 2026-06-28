# UX Readiness Pass: Onboarding Profile Save Busy Reason

## Finding

- **P3: First-run profile actions could disable without explaining the busy state.** "Start Pillar Time" and "Save profile" were disabled while the profile/name save was running but had no recovery title.

## Fix

- Added a shared disabled-state reason for onboarding profile save actions.
- Added runtime guardrails for the welcome and profile save button titles.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
