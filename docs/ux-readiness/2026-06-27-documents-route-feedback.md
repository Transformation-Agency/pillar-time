# UX Readiness Pass - 2026-06-27 - Documents Route And Feedback

## Area

Documents page and saved work-product context.

## Finding

P1 - Documents existed as a backend-backed page but was not reachable from navigation or the screen map.

The manual and architecture describe documents as context, and the backend exposes `/api/documents`, but the UI had no route for the page. Users could not discover or repair saved work-product context from the desktop app.

P2 - Document create/archive/reactivate actions could fail without visible feedback.

The form used a direct `.then()` reset and document status buttons directly called `mutate`. If a request failed, the page did not tell the user whether the document was saved or whether retrieval context changed.

## Fix

- Added Documents to the Context nav.
- Added `documents` to the icon map and screen map.
- Converted document creation to an async handler with success and failure copy.
- Added a status handler for archive/reactivate with success and failure copy.
- Replaced raw status button text with explicit `Archive` / `Reactivate` actions.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44040/#documents`
- Data directory: `/tmp/pillar-time-ux-documents-20260627`
- Command: `PORT=44040 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-documents-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Documents route rendered with `h1` of `Documents`.
- Documents nav item was visible.
- Created a disposable document.
- Archived and reactivated the document.
- Success feedback appeared after the final action.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the route/feedback source guards.
- Add a rendered Documents test later that creates a document, archives it, reactivates it, and verifies failure copy when the backend is unavailable.
