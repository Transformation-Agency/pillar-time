# UX readiness note: Approval execution flow

## Finding

- **P1: The Approvals page could mark an action approved without giving the user an execution path.** The backend already supports `POST /api/approvals/:id/execute`, and the Today calendar tiles use it, but the central Approvals page only exposed `Approve` and `Reject`. A user could reasonably believe `Approve` had performed the external Calendar/Linear write, or get stuck with an approved item and no visible next step.

## Fix

- Changed Approvals page copy to explain the two-step safety flow: approve first, then execute to write to Calendar or Linear.
- Added an `Execute` action for approved items that calls `/api/approvals/:id/execute`.
- Added success/failure feedback for execution.
- Added titles on `Approve` and `Reject` to clarify that approval does not execute.
- Rendered `resolutionNote` and treated executed approvals as successful status.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
