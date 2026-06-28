# UX Readiness Pass - 2026-06-28 - Document Draft Discard Confirmation

## Area

Documents page, create-document form.

## Finding

P2 - A user could paste a long document, memo, transcript, or context note into the Documents page and lose it by navigating away before saving.

Documents can feed retrieval and workflow context, so losing a pasted body silently undermines trust in the app as a place to unload mental clutter.

## Fix

- Added a create-document form baseline.
- Set a page-level dirty flag while the draft differs from the saved baseline.
- Added a route-change confirmation before leaving Documents with unsaved title, tags, or body text.
- Clear the dirty flag after successful document creation or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should paste a long document body, navigate away, cancel the discard prompt, confirm the draft remains, then repeat and accept the discard prompt.

