# UX Readiness Pass: Document Archive Confirmation

## Finding

- **P2: Document archive hid retrieval context immediately.** The Documents page uses saved documents as workflow retrieval context. Archiving an active document removes it from active context, but the action happened with one click and no explanation of the effect.

## Fix

- Added a confirmation before archiving an active document.
- The confirmation explains that the document will stop being used as active retrieval context until reactivated.
- Added explicit button titles for archive and reactivate actions.
- Reactivation remains one click because it restores context instead of hiding it.

## Guardrail

- Updated the Documents runtime guardrail to require the archive confirmation and action titles.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke skipped.
- `npm run build` passed.
- `git diff --check` passed.
