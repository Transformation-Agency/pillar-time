# UX Readiness Pass: Audio Setup Fallback Errors

## Finding

- **P3: Audio setup failures could render blank recovery copy.** The ElevenLabs setup flow caught detect, preview, and save failures, but displayed `error.message` directly. If the backend returned an empty or malformed error, the user could see no useful explanation after a failed setup action.

## Fix

- Added action-specific fallback messages for voice detection, audio preview, and saving audio settings.
- Added a runtime separation guardrail so these fallback messages remain present.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
