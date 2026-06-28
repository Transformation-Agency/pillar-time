# UX Readiness Pass: Review Template Enable Confirmation

## Finding

- **P2: Review templates could be enabled with one click.** Review templates are recurring planning rituals. Enabling one may cause Pillar Time to schedule future review prompts, so the user should explicitly consent before turning a template on.

## Fix

- Added confirmation before enabling a review template from the Reviews page.
- Added the same confirmation before enabling a review template from onboarding.
- The confirmation explains that Pillar Time may schedule the recurring review template.
- Disabling remains immediate because it reduces scheduling activity.

## Guardrail

- Updated the review template runtime guardrail to require the enable confirmation in both review toggle implementations.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
