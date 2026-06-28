# UX Readiness Pass - 2026-06-28 - Linear Draft Discard Confirmation

## Area

Linear page, create-issue form and issue comment drafts.

## Finding

P2 - A user could type a new Linear issue description or an issue comment, navigate away, and lose the draft without warning.

Linear work is one of the main inputs to day planning. Losing issue details or comments silently makes the app feel unsafe for real work.

## Fix

- Added a Linear page dirty flag for meaningful draft content.
- The dirty flag ignores the automatically selected team, so the page does not warn just because Linear bootstrap filled a team ID.
- Added a route-change confirmation before leaving Linear with unsaved issue details or typed comments.
- Existing successful create/comment actions already clear their relevant draft fields.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type a new issue description and a comment draft, navigate away, cancel the discard prompt, confirm both drafts remain, then repeat and accept the discard prompt.

