# UX Readiness Pass - 2026-06-27 - Planner Task Done Feedback

## Area

Planner page, Task Backlog.

## Finding

P2 - Planner task `Done` had no local success or failure message.

The Planner backlog feeds Today suggestions. If a user marks a task done and the local update fails, the app should not leave them wondering whether the task left the active planning surface.

## Fix

- Added an async `completeTask` handler.
- Successful task completion shows `<task title> marked done.`
- Failed task completion shows the backend error or `Could not mark task done.`
- The action uses the existing Planner page message area.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44038/#planner`
- Data directory: `/tmp/pillar-time-ux-planner-done-20260627`
- Command: `PORT=44038 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-planner-done-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Planner page rendered.
- Created a disposable task.
- Clicking `Done` produced visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less Planner task completion.
- Add a rendered Planner-page test later that creates a task, marks it done, and verifies success/failure copy.
- Include Planner task `Done` and `Archive` in the next keyboard-only pass.
