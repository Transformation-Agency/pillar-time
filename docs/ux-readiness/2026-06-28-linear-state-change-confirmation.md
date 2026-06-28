# UX Readiness Pass: Linear State Change Confirmation

## Surface

Linear issue table, state dropdown.

## Finding

- **P1: Linear issue state changes wrote to Linear immediately.** The issue state dropdown called the Linear update endpoint as soon as a user selected a different state. That is an external workspace mutation, and a misclick could move real project work without a confirmation step.

## Fix

- Added a `changeIssueState` guard before the existing Linear update call.
- The confirmation names the issue and target state before writing to Linear.
- Canceling the confirmation leaves the issue unchanged.
- The existing success/failure messages from `patchIssue` remain in place.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This is source-guarded. A later rendered UI pass should tab to the Linear state selector with mocked issues and verify cancel/confirm behavior against the actual controlled select.
