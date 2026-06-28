# UX Readiness Pass - 2026-06-28 - Planner Draft Discard Confirmation

## Area

Planner page, add-task and important-date forms.

## Finding

P2 - A user could start capturing a task, task notes, or an important date and lose the draft by navigating away before saving.

Planner items feed Today suggestions and calendar planning. Silent draft loss makes the app less trustworthy as a place to unload commitments.

## Fix

- Added baselines for the Planner task form and important-date form.
- Set a page-level dirty flag when either draft differs from its baseline.
- Added a route-change confirmation before leaving Planner with unsaved task or important-date edits.
- Clear the dirty flag after a successful task/date save or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type task notes and an important date, navigate away, cancel the discard prompt, confirm both drafts remain, then repeat and accept the discard prompt.

