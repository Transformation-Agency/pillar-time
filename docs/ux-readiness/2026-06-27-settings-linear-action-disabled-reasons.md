# UX readiness note: Settings Linear disabled reasons

## Finding

- **P2: Settings Linear actions could lead to avoidable setup failures.** The onboarding Linear step already explained missing API-key requirements before testing or saving, but the Settings Linear modal still allowed `Test`, `Save`, and `Open Linear` in states where the connector was missing credentials or not ready. A user could click into a predictable failure instead of seeing the next required action.

## Fix

- Added disabled reasons for Settings Linear `Test` and `Save` when no pasted key, saved key, or `LINEAR_API_KEY` fallback is available.
- Kept the existing `Disable` action available for already-enabled connectors.
- Disabled `Open Linear` from the modal until the connector is ready, with a title explaining that Linear must be connected first.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
