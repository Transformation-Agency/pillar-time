# UX Readiness Pass - 2026-06-27 - Linear Empty Comment Guard

## Area

Linear issue comments.

## Finding

P3 - Empty Linear comment submissions silently did nothing.

The Linear issue table showed a `Comment` button even when the comment field was blank. The handler returned early for empty text, so clicking the button produced no visible result. That is a small non-happy-path trap: the user can click a control and the app appears unresponsive.

## Fix

- Disable the per-issue `Comment` button until its comment field has non-whitespace text.
- Add a tooltip explaining `Type a comment first`.
- Preserve the existing successful comment flow once text is present.
- Add a source guard for the disabled empty-comment state.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 40 tests.
- `npm test` - pass, 62 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Linear interaction test later that verifies the button enables as soon as text is typed and clears the draft after a successful comment.
