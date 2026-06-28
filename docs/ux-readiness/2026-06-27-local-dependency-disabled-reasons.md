# UX Readiness: Local Dependency Disabled Reasons

Date: 2026-06-27

## Finding

P3 - Local dependency setup controls could be disabled without explaining why.

This affects onboarding and Settings for FFmpeg and local Whisper speech-to-text. These are install-adjacent actions, so a user needs clear recovery text when a check, install, or download is already running. Some failed runtime checks could also surface a blank warning if the backend returned no message.

## Fix

- Added explicit busy-state reasons for FFmpeg controls in onboarding and Settings.
- Added explicit busy-state reasons for local Whisper controls in onboarding and Settings.
- Added button titles so disabled controls explain what is happening.
- Added fallback messages for failed FFmpeg and Whisper checks/downloads.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 55 tests passed.
- `npm test` - pass, 77 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This pass does not actually install Homebrew FFmpeg or download a Whisper model. A packaged-app acceptance pass should exercise both paths on a clean Mac and verify that cancellation, failure, and success states are understandable.
