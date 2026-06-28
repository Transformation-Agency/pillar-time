# UX Readiness Pass: Approval Reject Confirmation

## Finding

- **P2: Rejecting an approval had no confirmation.** Approval items represent proposed Calendar or Linear actions. Rejection does not execute an external write, but it removes the pending action path from the queue with no obvious undo in the table.

## Fix

- Added confirmation before rejecting an approval.
- The confirmation explains that the action will not execute unless a new proposal is generated.
- Left approval as a one-click action because approving still requires a separate execution step before any external write.

## Guardrail

- Updated the approval status runtime guardrail to require the rejection confirmation before the status update call.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
