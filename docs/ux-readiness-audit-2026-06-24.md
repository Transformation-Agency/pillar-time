# Pillar Time UX Readiness Audit - 2026-06-24

## Verdict

RELEASE READY WITH WARNINGS for the default executive-day UX flow.

The clean-profile web runtime now completes the core first-run path without active news sources, without a model connector, and without Linear credentials. The product now behaves like an executive day-planning app by default: Today generates an `executive_day` artifact, uses deterministic fallback when the model is unavailable, surfaces context intake for the user's identity statement, standing commitments, and running to-do list, and keeps optional intelligence separate.

The remaining warnings are release-scope warnings, not confirmed app-stopping UX blockers: installed DMG launch, notarized packaging, real OAuth write-scope reconnect, and full keyboard/screen-reader verification still need a final packaged-app pass.

## Audit Context

- Repository: `Transformation-Agency/pillar-time`
- Checkout: `/Users/paul/Documents/Codex/2026-06-18/there-is-a-currently-running-version/work/pillar-time-repo`
- HEAD during audit: `8e8fcef`
- Runtime tested: `http://127.0.0.1:44021`
- Test data directory: `/tmp/pillar-time-ux-goal`
- Method: code inspection, clean-profile production server smoke, Chrome walkthrough, API non-happy-path probes, focused tests, full tests, production web build.

## Evidence Commands

- `PORT=44021 PILLAR_TIME_DATA_DIR=/tmp/pillar-time-ux-goal NODE_OPTIONS=--no-warnings node server/index.js` started successfully.
- `GET /api/state` returned first-run state with onboarding incomplete, Google Calendar needing consent, Linear missing credentials, and no fatal app error.
- `PATCH /api/connectors/linear` with an enabled empty API key returned `HTTP 400` and a clear validation message.
- `POST /api/workflow-runs` with `{ "runType": "executive_day", "trigger": "UX audit" }` completed successfully.
- Completed executive artifact title: `Executive day plan: 2026-06-24`.
- Completed executive artifact included deterministic brief text and Telegram delivery warning instead of a stopped workflow.
- Chrome walkthrough reached onboarding, skipped to Today, generated a day plan, and returned to the Today screen.
- `node --check server/index.js` passed.
- `node --test tests/timeEngine.test.js tests/runtimeSeparation.test.js` passed: 15 tests, 15 passed.
- `npm test` passed: 31 tests, 30 passed, 1 opt-in Linear live smoke skipped.
- `npm run build` passed and produced the Vite `dist/` bundle.
- `git diff --check` passed.

## Changes Applied During This Audit

- Default Today generation runs the executive-day workflow and renders a useful deterministic fallback when the model connector is not ready.
- The workflow run row is marked with `run_type='executive_day'` immediately so the Today page does not accidentally read an intelligence artifact.
- Calendar classification now distinguishes all-day events, timed events, primary calendars, shared/subscribed calendars, attendee status, ownership confidence, and blocking visibility.
- All-day events default to context rather than blocking time.
- Proposed calendar blocks are generated into the artifact and approval queue, but no Google Calendar writes happen during generation.
- Google Calendar approved writes are guarded behind approval execution and require reconnect with write scope.
- Today shows proposed calendar tiles, an `Approve Calendar` path, and latest executive-day timeline data only.
- Today includes Context Intake for `Identity statement`, `Standing commitment`, and `Running to-do`, with paste/type and text-file import before regeneration.
- Source deletion now asks for confirmation.
- Google Calendar disconnect now asks for confirmation.
- Calendar and default copy were recentered from "daily intelligence brief" to "executive operating system" language where it affects the default flow.
- Nav buttons now carry explicit `aria-label` and `title` attributes so compressed desktop layouts remain identifiable.
- Executive workflow copy now says `Deliver optional Telegram plan` instead of `brief`.

## Findings

### P0 - Default generation must not stop when model credentials are missing

Status: fixed locally and verified.

The clean-profile executive-day run completed with no model connector. The generated artifact explained the model connector was not ready and still produced a structured day plan from deterministic context.

Residual risk: real provider synthesis still needs live credential smoke before release, but the no-model first-run path no longer dead-ends.

### P0 - Cached news/intelligence must not leak into Today

Status: fixed locally and covered by tests.

`tests/runtimeSeparation.test.js` now checks that Today generation defaults to executive-day planning and remains separated from completed intelligence artifacts.

Residual risk: keep this as a regression guard whenever brief/intelligence screens are refactored.

### P1 - Calendar reality needs ownership and blocking classification

Status: fixed locally and covered by tests.

The deterministic classifier now treats accepted primary timed meetings as hard blocks, shared/subscribed events as context unless proven user-owned, declined events as ignored, and all-day items as non-blocking by default. Proposed calendar blocks preserve hard meetings and ignore all-day blockers.

Residual risk: LLM-assisted classification should be live-smoked with a real model and mixed calendars before release.

### P1 - Context inputs are required for a useful executive assistant

Status: implemented for the Today flow.

The Today screen now surfaces three context categories:

- `Identity statement`: stored as trusted context under `identity.self_statement`.
- `Standing commitment`: stored as trusted context under `profile.standing_commitment`.
- `Running to-do`: stored as a local time task with notes.

Users can type, paste, or import text-like files. `Add Context & Regenerate` saves the text first, then reruns the day plan.

Residual risk: file import accepts text-like files only and has not had a full keyboard/screen-reader pass.

### P1 - External writes must be approval-gated

Status: implemented for generated Calendar and Linear actions.

Generated calendar blocks are saved as proposed blocks and approval items. `POST /api/approvals/:id/execute` performs approved Calendar/Linear writes and verifies Calendar events by re-fetching.

Residual risk: the real Google OAuth token must be reconnected with the new write scope before end-to-end Calendar write verification.

### P1 - Source and connector mutations need clear local guardrails

Status: improved locally.

Empty Linear key saves are rejected by the backend. Source deletion and Google Calendar disconnect now require browser confirmation before mutation.

Residual risk: other low-risk local archive/done actions are still direct actions. That is acceptable for planner/task ergonomics, but destructive connector/source actions should keep confirmation.

### P2 - Narrow desktop nav can compress visually

Status: mitigated locally.

The walkthrough showed the nav is usable, but some labels can compress at desktop widths with many tabs. Buttons now include explicit labels/titles. The app should still get a packaged-window screenshot pass at the default Tauri width.

### P2 - Intelligence wording still exists in optional intelligence areas

Status: acceptable by design.

The default Today flow is now executive-day language. The optional `Intelligence` and source setup areas still use brief/source language because that workflow remains available separately.

### P2 - Packaged desktop release verification remains incomplete

Status: not run in this audit.

The web runtime, backend checks, and production web build passed. This audit did not launch a freshly notarized DMG or verify updater/signing/notarization behavior. Treat that as release checklist work, not a product-logic blocker.

## Recommended Acceptance Tests Before Release

1. Install the notarized DMG fresh on macOS and verify it opens Today without port conflict.
2. Reconnect Google Calendar with the updated write scope, generate a day plan, approve the proposed calendar, and verify created blocks appear on the intended primary calendar.
3. Use a mixed calendar account with primary, shared, subscribed, all-day, declined, and overlapping events; verify only real hard commitments block scheduling.
4. Add identity statement, standing commitments, and a running to-do file; regenerate and verify the new context changes the day plan.
5. Run the packaged app at default, 1024px, 1280px, and 1440px widths; verify header/nav, proposed calendar tiles, and context intake do not overlap.
6. Run a keyboard-only pass through onboarding, Today context intake, Generate Day Plan, Approve Calendar, and Settings connectors.
7. Run one intelligence workflow explicitly and verify it remains separate from Today's latest executive-day timeline.

## Final Assessment

The core UX direction is now aligned with Pillar Time's intended product: a candid executive operating loop for commitments, calendar pressure, Linear work, and approved next actions, with news/intelligence as an optional side capability.

Ship candidate status is reasonable after packaged-app verification and one real Calendar write-scope approval smoke. Do not ship a public release solely on the web-runtime evidence in this audit.
