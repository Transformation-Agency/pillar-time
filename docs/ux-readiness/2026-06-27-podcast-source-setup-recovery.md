# UX Readiness Pass: Podcast Source Setup Recovery

## Finding

- **P3: Podcast source setup had unclear disabled and failure states.** The Spotify "Resolve RSS" action could be disabled without a recovery title, the transcription checkbox could be disabled without saying which dependency was missing, and Spotify resolution could show a blank backend error.

## Fix

- Added disabled-state reasons for Spotify RSS resolution and podcast transcription.
- Added fallback copy when Spotify RSS resolution fails without a backend message.
- Added runtime guardrails for the podcast source setup recovery copy.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
