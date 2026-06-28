# UX Readiness Pass - 2026-06-27 - Settings Onboarding Reset Feedback

## Area

Settings first-run onboarding reset.

## Finding

P2 - Reopening first-run onboarding had no visible success or failure feedback.

Settings includes a `Reopen onboarding` action, which is important for recovery when a first-run setup goes wrong or a user skips too much. The action asked for confirmation, then directly called the backend. If the backend reset failed, the user had no visible message explaining that onboarding was not reopened.

## Fix

- Added a top-level Settings feedback message.
- Clear stale Settings feedback before retrying onboarding reset.
- Show `First-run onboarding reopened.` on success.
- Show the backend error or `Could not reopen onboarding.` on failure.
- Added a regression guard for the success/failure feedback path.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 42 tests.
- `npm test` - pass, 64 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Settings test later that mocks `/api/onboarding/reset` failure and verifies the warning remains visible under the page header.
