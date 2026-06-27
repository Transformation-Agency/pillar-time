# UX Readiness Pass - 2026-06-27 - Context Regenerate Guard

## Area

Today context intake and first-run recovery.

## Finding

P1 - `Add Context & Regenerate` could run a new day plan after a context save failure.

This is a trust issue: if a user adds important context and the save fails, the app should not immediately generate a new plan that appears to include that context. That would make the next plan feel authoritative while silently ignoring the user's correction.

## Fix

- `saveContext` now returns `true` only after the relevant context write succeeds.
- Empty context shows `Add context before saving.` and returns `false`.
- Save failures keep the backend error visible and return `false`.
- `Add Context & Regenerate` now stops before generation when the context save returns `false`.

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass, 31/31.
- `npm test`: pass, 53 passed / 1 opt-in Linear smoke skipped.
- `npm run build`: pass.
- `git diff --check`: pass.
- `node --check server/index.js`: pass.
- `node --check src/main.jsx`: not applicable because this Node syntax checker does not accept `.jsx` module files; Vite build is the authoritative frontend syntax check.

## Runtime Smoke

Isolated runtime:

- URL: `http://127.0.0.1:44031/#today`
- Data directory: `/tmp/pillar-time-ux-20260627`
- Command: `PORT=44031 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-20260627 NODE_OPTIONS=--no-warnings node server/index.js`

System Chrome smoke:

- Clean first-run screen rendered with `Set up your executive operating system.`
- `Skip and set up manually` reached Today.
- Today preflight rendered: `Generate works with available local context. Missing connectors will be reported: Calendar, Linear, model.`
- `Context Intake` rendered.
- `Generate Day Plan` completed on Today.
- No `Brief generation stopped` copy appeared.
- Browser console errors: none.
- Request failures: none.

## Recommended Regression Tests

- Keep the existing source-level guard that verifies context regenerate stops when save fails.
- Add a rendered interaction test later with a mocked failing `/api/trusted-context/facts` response to prove the day-plan API is not called after the save failure.
- Add a keyboard-only pass through context intake, file import, Save Context, and Add Context & Regenerate in the packaged app.
