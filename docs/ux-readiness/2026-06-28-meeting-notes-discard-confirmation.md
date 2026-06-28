# UX Readiness Pass - 2026-06-28 - Meeting Notes Discard Confirmation

## Area

Meetings page, manual meeting-note capture.

## Finding

P2 - A user could type or paste prep notes, decisions, or follow-ups into the Meetings page and lose the draft by navigating away before saving.

Meeting notes are a core input for commitments and follow-up planning. Losing them silently works against Pillar Time's goal of reducing mental clutter.

## Fix

- Added a meeting-note form baseline.
- Set a page-level dirty flag while the draft differs from the saved baseline.
- Added a route-change confirmation before leaving Meetings with unsaved title, start time, or notes.
- Clear the dirty flag after successful save or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type meeting notes, navigate away, cancel the discard prompt, confirm the notes remain, then repeat and accept the discard prompt.

