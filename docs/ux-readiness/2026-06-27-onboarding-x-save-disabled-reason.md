# UX Readiness: Onboarding X Save Disabled Reason

## Finding

- **P3: First-run X source setup could leave `Save X API` active with no token to save.** In the access-prerequisite step, users could click the save action before pasting a bearer token and only learn the problem after the request path.

## Fix

- Added a disabled-state reason for onboarding `Save X API` when there is no pasted token and no saved token.
- The title tells users to paste a bearer token or skip X sources for now.
- Added a source-level guardrail for the disabled reason.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This fixes the first-run prerequisite card. A later Settings pass should review the standalone X setup modal with the same missing-token lens.
