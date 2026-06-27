# UX Readiness Pass - 2026-06-27 - Review Toggle Feedback

## Area

Reviews page.

## Finding

P2 - Review template enable/disable actions had no local success or failure message.

The Reviews page is part of first-run planning setup. If a user enabled a review template and the backend save failed, the action could fail without a clear page-level recovery clue. Other planning surfaces already expose local save feedback, so Reviews should match that trust pattern.

## Fix

- Added page-local `reviewMessage` state.
- Routed review enable/disable through an async `toggleReview` handler.
- Successful changes show `<review title> enabled.` or `<review title> disabled.`
- Failed changes show the backend error or `Could not update review.`

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44032/#reviews`
- Data directory: `/tmp/pillar-time-ux-reviews-20260627`
- Command: `PORT=44032 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-reviews-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Clean first-run skip reached the app.
- Reviews page rendered.
- First `Enable` action produced visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less review mutations.
- Add a rendered Reviews-page test later that mocks a failing `/api/time/reviews/:id` patch and asserts the warning text appears.
