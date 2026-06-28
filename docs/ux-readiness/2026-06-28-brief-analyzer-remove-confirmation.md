# UX Readiness Pass: Brief Analyzer Remove Confirmation

## Finding

- **P2: Analyzer removal changed future brief behavior with one click.** Brief analyzers shape generated briefs through the master prompt. Removing one can change future analysis quality and perspective coverage.

## Fix

- Added confirmation before removing an analyzer from Brief setup.
- The confirmation explains that future generated briefs will stop using that analysis lens until it is added again.
- Preserved the existing guard that prevents removing the final analyzer.

## Guardrail

- Updated the Brief setup runtime guardrail to require the analyzer removal confirmation and reject the old direct `markForm` removal pattern.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
