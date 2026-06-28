# UX Readiness: Settings X Save Disabled Reason

## Finding

- **P3: Settings X API setup could leave `Save X API` active with no token to save.** The modal handled failed saves, but the primary save action did not explain the missing token before the user tried it.

## Fix

- Added a Settings-only disabled-state reason for `Save X API` when no bearer token is pasted and no token is already saved.
- The title tells users to paste an X bearer token before saving.
- Added a source-level guardrail for the disabled reason.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded copy and disabled-state behavior. A later packaged-app Settings pass should still confirm the modal feels clear with missing, saved, and replacement X tokens.
