# UX Readiness Pass: Source Editor Discard Confirmation

## Surface

Sources page, add/edit source modal.

## Finding

- **P2: Unsaved source edits could be discarded silently.** The source editor reset the form when the user clicked Cancel, clicked the close button, or clicked the backdrop. A user could paste a feed URL, search query, podcast URL, or source name and lose it without a warning.
- **P2: Editing a source could hit a missing credential-status helper.** The edit path referenced `sourceCredentialStatus`, but the helper was absent. That could turn the recovery/edit path itself into a runtime failure.

## Fix

- Added a baseline snapshot for the source editor.
- Added a shared `closeSourceForm` handler that asks before discarding unsaved source name, type, or locator edits.
- Routed backdrop close, close button, and Cancel through the guarded close handler.
- Confirmed discard still resets the form and Spotify resolver state.
- Added the missing source credential-status fallback used when editing sources.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 74 tests.
- `npm test` passed: 96 tests, 1 opt-in live Linear smoke skipped.
- `npm run build` passed.

## Residual Risk

This is source-guarded. A rendered UI pass should paste source details, click Cancel, reject the discard prompt, and confirm the modal remains open with the typed values intact.
