# UX Readiness Pass: Onboarding Setup Fallback Errors

## Finding

- **P3: First-run setup errors could become blank or too generic.** Model discovery, brief setup drafting/apply, source suggestions, and source add failures forwarded raw backend messages in several catch blocks. If the API returned an empty or malformed error, onboarding could stall without telling the user what failed.

## Fix

- Added specific fallback recovery messages for model detection, brief setup draft/apply, source suggestion, and selected-source add failures.
- Extended runtime guardrails for onboarding setup fallback messages.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
