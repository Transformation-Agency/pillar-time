# UX Readiness: Brief Audio Disabled Reasons

Date: 2026-06-27

## Finding

P3 - Saved brief audio controls could be disabled without explaining the exact reason on the action itself.

The brief reader already showed nearby setup text when ElevenLabs was unavailable, but the `Generate audio`, `Play audio`, and `Restart` buttons did not expose the blocked reason. That makes the non-happy path weaker for keyboard users, hover users, and anyone scanning the control itself.

## Fix

- Added one shared `briefAudioDisabledReason`.
- The reason distinguishes an active audio generation from missing ElevenLabs setup.
- Added titles to the audio and restart buttons with the recovery instruction.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 51 tests passed.
- `npm test` - pass, 73 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level guardrail and copy fix. A packaged-app visual pass should still verify the brief reader audio controls in the Tauri WebView with ElevenLabs both configured and unconfigured.
