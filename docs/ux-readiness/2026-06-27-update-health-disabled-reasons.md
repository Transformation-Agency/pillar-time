# UX Readiness Pass: Update And Health Disabled Reasons

## Finding

- **P3: Update and health-check controls could be disabled without recovery copy.** The Help menu update check, Settings update check, and Settings local health check all had busy disabled states but did not explain why the action was unavailable.

## Fix

- Added disabled-state reasons for update checking/installing in the Help menu and Settings.
- Added a disabled-state reason while the local health check is already running.
- Added runtime guardrails for the update and health check recovery titles.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
