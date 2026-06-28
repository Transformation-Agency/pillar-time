# UX Readiness Pass - 2026-06-27 - Trusted Context Action Feedback

## Area

Trusted Context profile facts and memory proposals.

## Finding

P2 - Trusted Context actions could fail or no-op without enough visible recovery feedback.

Trusted Context is one of the most important inputs for daily planning. The profile fact form sent whatever was in the form to the backend, and proposal approve/reject actions directly called `mutate` without a local success or failure message. A user could believe a profile fact or proposal decision was recorded when the save failed or required fields were missing.

## Fix

- Added required-field feedback for profile facts before saving.
- Disabled `Save fact` until resource type, field key, and value are present.
- Added a tooltip explaining the missing fields.
- Added fallback error copy for profile fact saves and envelope preview refresh.
- Wrapped memory proposal approve/reject actions with visible success and failure messages.
- Added source guards for the required-field, save-error, and proposal-action feedback paths.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 41 tests.
- `npm test` - pass, 63 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Trusted Context test later that forces failed profile fact saves and proposal status updates, then verifies warning text remains visible on the page.
