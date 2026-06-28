# UX Readiness Pass: Onboarding Access Disabled Reasons

## Finding

- **P3: Some first-run setup actions could be disabled without saying why.** The Linear test button, perspective voice input button, and "Continue with ready sources" button each had valid disabled states but no recovery title.

## Fix

- Added disabled-state reasons for:
  - testing Linear before an API key is pasted
  - using voice input when the WebView lacks microphone/audio support
  - continuing source access when no pending source is ready to add
- Added runtime guardrails for these onboarding recovery titles.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
