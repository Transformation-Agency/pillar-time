# UX Readiness Pass: Perspective Lens Remove Confirmation

## Finding

- **P3: Perspective lens removal had no confirmation.** The Perspective Lenses editor let users remove a deliberation lens immediately from the draft editor. The change still required saving to persist, but the action gave no warning about what would stop happening.

## Fix

- Added a confirmation before removing a perspective lens.
- The confirmation explains that the lens stops being used after perspective lenses are saved.
- Added a title to the remove action so the target lens is clear.
- Added a source-level guardrail for the confirmation copy and title.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level confirmation and copy guard. A later rendered UI pass should still verify the confirmation text in the packaged desktop app.
