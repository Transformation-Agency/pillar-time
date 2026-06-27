# UX Readiness Pass - 2026-06-27 - Today Commitment Done Feedback

## Area

Today page, Today's Three.

## Finding

P2 - Marking a Today's Three commitment done had no local success or failure message.

Today's Three is the core daily commitment surface. If a user clicks `Done` and the local backend update fails, the app should not make them guess whether the protected commitment was completed or whether it is still active.

## Fix

- Added page-local `commitmentMessage` state.
- Routed `Done` through an async `completeDailyCommitment` handler.
- Success shows `<commitment title> marked done.`
- Failure shows the backend error or `Could not mark commitment done.`

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44037/#today`
- Data directory: `/tmp/pillar-time-ux-today-done-20260627`
- Command: `PORT=44037 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-today-done-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Today page rendered.
- Seeded a disposable Today's Three commitment.
- Clicking `Done` produced visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less commitment completion.
- Add a rendered Today-page test later that accepts a suggestion, marks it done, and verifies success/failure copy.
- Include Today's Three `Done` and `Remove` in the next keyboard-only pass.
