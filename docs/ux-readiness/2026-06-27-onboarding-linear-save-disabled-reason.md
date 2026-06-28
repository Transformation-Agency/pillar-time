# UX Readiness: Onboarding Linear Save Disabled Reason

## Finding

- **P3: First-run Linear setup could leave `Save Linear` clickable with no key to save.** The handler showed recovery copy after the click, but the setup step did not explain the missing requirement before the user tried it.

## Fix

- Added a disabled-state reason for onboarding `Save Linear` when there is no pasted key, no saved key, and no environment fallback.
- The title tells users to paste a key or skip Linear for now.
- Added a source-level guardrail for the disabled reason.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded copy and disabled-state behavior. A later first-run visual pass should still walk the Linear step with missing, saved, and environment-backed credentials.
