# UX Readiness Pass - 2026-06-27 - Approval Status Feedback

## Area

Approvals page.

## Finding

P1 - Approval approve/reject actions had no local success or failure message, and the approval queue was not reachable from the app shell.

Approvals are the safety layer for generated actions. If an approval status update fails, the user needs a visible recovery clue instead of wondering whether the approval went through. This is especially important because approval state can control later external actions.

During browser smoke, `#/approvals` fell through to the overview screen because the `Approvals` component was not included in the route map or navigation. That made the central approval queue effectively hidden.

## Fix

- Added page-local `approvalMessage` state.
- Routed Approve and Reject through an async `updateApprovalStatus` handler.
- Successful changes show `<approval title> approved.` or `<approval title> rejected.`
- Failed changes show the backend error or `Could not <status> approval.`
- Added `Approvals` to the Context navigation group.
- Added the `approvals` screen to the app route map.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44035/#approvals`
- Data directory: `/tmp/pillar-time-ux-approvals-current-20260627`
- Command: `PORT=44035 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-approvals-current-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke against a freshly rebuilt frontend bundle:

- `#/approvals` rendered the Approvals page.
- The shell navigation exposed `Approvals`.
- A generated day plan produced one pending approval.
- Clicking `Approve` produced visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less approval status mutations.
- Add a rendered Approvals-page test later that mocks a failed `/api/approvals/:id` patch and asserts the warning text appears.
- Add an end-to-end approval test covering pending calendar proposal -> approve -> execute -> verified or reconnect-required state.
