# UX Readiness Pass: Initial Boot Loading State

## Finding

- **P3: Initial boot loading could look frozen.** Before the app received its first local state payload, the screen only said `Loading Pillar Time...`. After a fresh install, update, or backend startup delay, a real user could read that as a stuck app instead of normal local startup work.

## Fix

- Replaced the one-line loading copy with a status region that says Pillar Time is starting.
- Added plain recovery-oriented copy explaining that the local backend and workspace data are loading and that this can take a moment after install or update.
- Added `role="status"` and `aria-live="polite"` so assistive technology gets a meaningful startup status.

## Guardrail

- Added a runtime separation test that requires the explanatory startup copy and prevents the old ambiguous one-line loading state from returning.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 71 tests.
- `npm test` passed: 93 passed, 1 opt-in Linear smoke skipped.
- `npm run build` passed.
- `git diff --check` passed.
