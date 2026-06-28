# Onboarding Progress Save Warning - 2026-06-28

## Finding

P2 - Onboarding step navigation could fail to save progress without telling the user.

The shared onboarding navigation helper updates the visible step and then patches `/api/onboarding`. If that backend save failed, the user could keep moving through onboarding but a reload or restart might return to the old step with no explanation.

## Fix

- Kept onboarding navigation responsive by changing the visible step immediately.
- Added visible warning copy when saving onboarding progress fails.
- The warning explains that the user can keep going, but reload may return to the previous step.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded. A rendered offline/backend-failure pass should later click several onboarding rail steps with the backend unavailable and confirm the warning remains visible.
