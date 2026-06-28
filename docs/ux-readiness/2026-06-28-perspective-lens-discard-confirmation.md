# UX Readiness Pass - 2026-06-28 - Perspective Lens Discard Confirmation

## Area

Perspective Lenses page.

## Finding

P2 - The page showed an "Unsaved changes" message after editing lenses, but a user could still navigate away and lose lens names, roles, descriptions, or instructions without confirmation.

Lens instructions can be long and shape later deliberation. Showing an unsaved state without protecting it is a trust gap.

## Fix

- Reused the existing `dirty` state as a page-level dirty flag.
- Added route-change confirmation before leaving Perspective Lenses with unsaved changes.
- Clear the dirty flag after a successful save or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should edit a lens instruction, navigate away, cancel the discard prompt, confirm the edit remains, then repeat and accept the discard prompt.

