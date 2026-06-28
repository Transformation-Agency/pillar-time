# Today Generate Saves Pending Input - 2026-06-28

## Finding

P2 - Today could ignore pending user input when generating a day plan.

If a user typed a task into Quick Capture and clicked **Generate Day Plan** instead of **Capture**, the workflow ran without that task. That is a high-friction mental-clutter failure: the user already gave Pillar Time the loose thought, but the plan could still miss it.

## Fix

- Refactored Quick Capture saving into a shared `saveQuickCapture()` helper.
- `Generate Day Plan` now saves pending Quick Capture text before running.
- Generation already saved pending Context Intake text through `regenerateWithContext()`, so the button now uses that path too.
- If either save fails, generation stops and leaves the relevant warning visible.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded. A rendered pass should type Quick Capture text, click Generate, and confirm the task appears before the workflow begins.
