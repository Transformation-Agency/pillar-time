# UX Readiness Pass: Trusted Context Proposal Confirmation

## Finding

- **P1: Memory proposals could be accepted into planning context with one click.** Trusted Context affects future planning, coaching, and generated briefs. A mistaken approval could make Pillar Time treat a learned observation as trusted guidance.

## Fix

- Added confirmation before approving a memory proposal.
- Added confirmation before rejecting a memory proposal.
- The approval confirmation explains that Pillar Time may use the proposal in future planning and coaching.
- The rejection confirmation explains that the proposal will not be used unless a new proposal is created.
- Added explicit button titles for approve/reject actions.

## Guardrail

- Updated the Trusted Context runtime guardrail to require proposal confirmations and explicit action titles.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
