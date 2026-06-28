# UX Readiness Pass: Podcast Transcription Fallback Error

## Finding

- **P3: Podcast transcription could fail without useful recovery copy.** The source editor's manual podcast transcription action displayed `error.message` directly. If the backend returned an empty or malformed error, the user could be left without an explanation after a failed transcription attempt.

## Fix

- Added a clear fallback message for podcast transcription failures.
- Extended the source-action guardrail to cover transcription failure copy.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
