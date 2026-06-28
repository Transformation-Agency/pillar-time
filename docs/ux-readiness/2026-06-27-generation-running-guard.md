# UX Readiness Pass: Generation Running Guard

## Finding

- **P2: Primary generation actions did not explain or guard an already-running workflow.** The Today and Briefs screens could present active Generate actions without a disabled reason while a run was already in progress. A fast double-click or slow route transition could start duplicate work or make the user wonder whether the first click registered.

## Fix

- Added an app-level in-flight guard around `runWorkflow`.
- Added a shared disabled reason: `A generation run is already in progress`.
- Applied that reason to the Today `Generate Day Plan`, Today `Add Context & Regenerate`, and Briefs `Generate brief` actions.
- Kept the current generation progress route as the recovery destination when a duplicate run request arrives.

## Guardrail

- Added a runtime separation test that requires the in-flight ref guard, the shared disabled reason, and the disabled/title affordances on the main generation actions.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 72 tests.
- `npm test` passed: 94 passed, 1 opt-in Linear smoke skipped.
- `npm run build` passed.
- `git diff --check` passed.
