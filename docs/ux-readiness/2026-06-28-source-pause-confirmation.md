# UX Readiness Pass: Source Pause Confirmation

## Finding

- **P2: Source pause was easy to misclick.** The Sources table allowed a one-click pause on an active source. Pausing is reversible, but it removes that source from future runs and can quietly degrade coverage.

## Fix

- Added confirmation before pausing an active source.
- The confirmation explains that the source will be skipped in future runs until resumed.
- Added explicit hover titles for pausing and resuming.
- Kept resume one-click because it restores coverage and does not remove data.

## Guardrail

- Updated the source table runtime guardrail to require the pause confirmation and pause/resume titles.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
