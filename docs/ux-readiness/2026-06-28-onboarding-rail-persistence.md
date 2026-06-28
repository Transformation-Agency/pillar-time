# Onboarding Rail Persistence - 2026-06-28

## Finding

P2 - The onboarding step rail changed the visible step with local state only.

Most onboarding navigation uses the shared `go()` helper, which also saves `currentStep` and draft setup state. The rail bypassed that helper, so a user could click a step, reload or recover from a backend restart, and land back on the previously saved step instead of the step they selected.

## Fix

- Updated onboarding rail buttons to use the persisted `go(id)` navigation path.
- Added a runtime guard test to prevent the rail from regressing to local-only `setStep(id)` navigation.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is covered by source-level tests. A future browser pass should confirm clicking rail steps still feels responsive when the backend is slow.
