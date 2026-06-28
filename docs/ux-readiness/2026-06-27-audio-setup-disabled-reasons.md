# UX Readiness Pass - 2026-06-27 - Audio Setup Disabled Reasons

## Area

ElevenLabs audio setup in onboarding and Settings.

## Finding

P3 - Audio setup buttons could be disabled without explaining the missing step.

The ElevenLabs setup flow includes several state-dependent controls: `Detect voices`, `Play preview`, and `Save audio`. These buttons could be disabled because setup was busy, no API key was available, or no voice had been chosen, but the UI did not expose a reason. That can make a credential setup flow feel broken.

## Change

- Added disabled-state reason strings for audio setup.
- `Detect voices` now explains when an API key is needed or setup is busy.
- `Play preview` now explains when a voice must be chosen or detected first.
- `Save audio` now explains when the user needs an API key or selected voice.
- Added runtime-separation guard coverage.

## Why This Matters

Audio is optional, but it appears during onboarding and Settings. Optional setup should be easy to skip, and when a user chooses to configure it, disabled actions should make the next step obvious.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 47 passed.
- `npm test` - pass, 69 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified. A future rendered pass should tab through ElevenLabs setup with no key, a saved key, and a detected voice to confirm the button reasons are discoverable enough in the packaged app.
