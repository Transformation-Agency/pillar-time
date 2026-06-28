# UX Readiness Pass: Approval Execute Confirmation

## Finding

- **P1: Executing an approved action could write externally with one click.** The Approvals page already separates approval from execution, but the `Execute` button is the moment Pillar Time may write to Google Calendar or Linear. A final confirmation helps users trust that external side effects are intentional.

## Fix

- Added a confirmation before executing an approved action.
- The confirmation names the action and explains that Pillar Time may write to Google Calendar or Linear and then record the result in the audit log.
- Kept the existing explicit execution flow and failure message.

## Guardrail

- Updated the approval execution runtime guardrail to require the confirmation before the `/api/approvals/:id/execute` call.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke skipped.
- `npm run build` passed.
- `git diff --check` passed.
