# UX Readiness Pass: Linear Disable Confirmation

## Finding

- **P2: Linear disable was immediate and its success message looked like a warning.** In Settings, disabling Linear removes current project-work context from day planning, but the button did not ask for confirmation. After success, `Linear connector disabled.` was styled as a warning because only `ready` and `enabled` messages were treated as successful.

## Fix

- Added confirmation copy before disabling Linear that explains the planning impact.
- Kept the backend failure path visible in the existing modal message.
- Treated the successful disabled message as `ok-text` instead of warning text.

## Guardrail

- Added a runtime separation test that requires the disable confirmation and the non-warning disabled success styling.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke skipped.
- `npm run build` passed.
- `git diff --check` passed.
