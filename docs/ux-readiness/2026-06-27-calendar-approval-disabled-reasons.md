# UX Readiness: Calendar Approval Disabled Reasons

Date: 2026-06-27

## Finding

P2 - The proposed-calendar approval button could be disabled without explaining why.

This is a trust-boundary control. When the button says `Calendar Added`, `Calendar Rejected`, or `No Approval Available`, a real user needs to know whether the app is protecting them from a duplicate write, respecting a rejection, or waiting for a new generated proposal.

## Fix

- Added `approvalDisabledReason` for non-executable calendar approval states.
- The button now explains:
  - calendar blocks were already added;
  - the proposal was rejected;
  - a new day plan with a calendar proposal is needed.
- Kept existing approval behavior unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 52 tests passed.
- `npm test` - pass, 74 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level guardrail and copy fix. A packaged-app pass should still approve a real calendar proposal after reconnecting Google Calendar with write scope and confirm duplicate/previously rejected proposals remain understandable.
