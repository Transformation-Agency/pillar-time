# UX Readiness Pass: Model Provider Save Disabled Reason

## Finding

- **P3: Model provider save could submit without a model name.** The Settings model provider modal had recovery copy for failed saves, but `Save provider` remained available even when the model field was blank. That can create an avoidable failed request during setup.

## Fix

- Disabled `Save provider` until a model name is entered or detected.
- Added a hover title explaining: `Enter or detect a model name before saving`.
- Preserved the existing save behavior once a model name is available.

## Guardrail

- Updated the settings credential runtime guardrail to require the model-save disabled reason and title.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
