# UX Readiness Pass - 2026-06-27 - Source Action Feedback

## Area

Sources page route/nav, source add/edit, active/paused toggle, and delete actions.

## Finding

P1 - The Sources page existed in code but was not reachable from the current route map/nav.

Opening `#sources` fell back to Intelligence, which made source management a dead-end for users who need to understand or repair intelligence coverage.

P2 - Source management actions could fail without a visible local result.

Sources control what the intelligence pipeline monitors. If a pause, resume, delete, or save request fails, users need to know immediately instead of assuming coverage changed.

## Fix

- Converted source save to an async handler with success and failure copy.
- Added `updateSourceStatus` for active/paused changes with local feedback.
- Added `deleteSource` for confirmed deletions with local feedback.
- Added Sources back to the Context nav and screen map.
- Kept the existing confirmation before deleting a source.
- Reused the Sources panel message area instead of redesigning the table.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44039/#sources`
- Data directory: `/tmp/pillar-time-ux-source-feedback-20260627d`
- Command: `PORT=44039 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-source-feedback-20260627d NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Sources route rendered with `h1` of `Sources`.
- Sources nav item was visible.
- Added a disposable RSS source.
- The source appeared in the table.
- Active/paused status changes showed visible feedback.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the source guard that prevents direct, message-less status mutation.
- Add a rendered Sources-page test later for save, pause/resume, delete cancel, delete success, and delete failure.
- Include Sources in the next keyboard-only pass because source management is a high-risk settings workflow.
