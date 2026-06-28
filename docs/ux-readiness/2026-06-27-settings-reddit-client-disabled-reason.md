# UX Readiness: Settings Reddit Client ID Disabled Reason

## Finding

- **P3: Settings Reddit OAuth setup could test or save without a client ID.** The modal explained that a Reddit app client ID is needed, but the `Test` and `Save Reddit OAuth` actions stayed active until the backend rejected the request.

## Fix

- Added a disabled-state reason when no Reddit client ID is pasted and no saved Reddit credential exists.
- Applied the reason to both `Test` and `Save Reddit OAuth`.
- Added a source-level guardrail for the disabled reason.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level recovery copy fix. A later packaged-app Settings pass should verify the Reddit OAuth modal for both `client_credentials` and `installed_client` grant types.
