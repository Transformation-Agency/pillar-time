# UX Readiness Pass - 2026-06-27 - Linear Create Disabled Reason

## Area

Linear page, `Create Linear issue` form.

## Finding

P3 - The Linear issue create button could be disabled without explaining why.

Most high-use capture buttons now expose a title that tells the user what is missing. The Linear create form still disabled `Create issue` when the title or team was missing, but it did not provide the same recovery clue.

## Change

- Added `linearCreateDisabledReason`.
- The create button now says why it is disabled:
  - `Add an issue title first`
  - `Choose a Linear team first`
- When the form is ready, the title becomes `Create Linear issue`.
- Added a runtime-separation guard beside the other high-use disabled-control checks.

## Why This Matters

Linear is part of the executive day planning loop. If a user is trying to capture work and the primary action is unavailable, the form should explain the next step instead of making the button feel broken.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 46 passed.
- `npm test` - pass, 68 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified. A rendered UI pass should eventually tab through the Linear form and confirm the title/help text is discoverable enough in the packaged desktop app.
