# Onboarding Skip Discard Confirmation - 2026-06-28

## Finding

P2 - First-run onboarding could be skipped while typed setup input was still unsaved.

The risky fields included profile notes, starter commitments, intelligence prompts, model keys, Linear keys, and other connector setup text. A user who clicks "Skip and set up manually" or "Finish later" may be trying to recover from setup friction, so silently throwing away typed input makes the app feel less safe.

## Fix

- Added an onboarding unsaved-input check for typed profile/setup fields and connector keys.
- Added a confirmation before leaving onboarding when those fields contain unsaved text.
- Kept the existing skip behavior unchanged when there is no unsaved setup input.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This test is source-level. A later browser pass should verify the native confirmation appears from both the top "Skip and set up manually" button and the review step's "Finish later" button.
