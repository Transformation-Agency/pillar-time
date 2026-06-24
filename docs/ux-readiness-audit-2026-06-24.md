# Pillar Time UX Readiness Audit - 2026-06-24

## Verdict

RELEASE READY WITH WARNINGS for UX flow, pending installed-app visual and packaging verification.

The original first-run blockers found in this audit have been fixed locally: Today now generates an executive day plan, missing model credentials produce a deterministic plan instead of a stopped workflow, Linear cannot falsely enable without credentials, the header no longer allows nav overlap in CSS, and onboarding now explains key non-happy paths. The remaining release risk is verification scope: installed DMG launch, notarized packaging, and final screenshot/keyboard passes still need to run against the packaged app.

## Audit Context

- Repository: `Transformation-Agency/pillar-time`
- Checkout: `/Users/paul/Documents/Codex/2026-06-18/there-is-a-currently-running-version/work/pillar-time-repo`
- HEAD: `3f0fc4b`
- Runtime tested: production server at `http://127.0.0.1:43996/index.html#today`
- Test data directory: `/tmp/pillar-time-ux-audit`
- Method: code inspection, production build, production server smoke, Chrome first-run walkthrough, onboarding connector non-happy paths, Google Calendar OAuth, main Today screen generation path.

## Evidence Commands

- `npm install` completed successfully: 94 packages, 0 vulnerabilities.
- `npm test` passed after the UX fixes: 26 tests total, 25 passed, 1 Linear live-smoke test skipped.
- `node --check server/index.js` passed.
- `node --check scripts/prepare-tauri-sidecar.mjs` passed.
- `npm run build` passed and produced the Vite `dist/` bundle.
- `npm start` ran production server smokes successfully on temporary ports for executive-day fallback, Linear validation, header/route checks, and root-route recovery.
- Production route smoke returned `HTTP 200` and the built SPA HTML for `/`, `/#/today`, `/index.html#today`, and `/missing-route`.
- `cargo check --manifest-path src-tauri/Cargo.toml` failed because the required sidecar binary was absent at `binaries/pillar-time-backend-aarch64-apple-darwin`. This is expected before sidecar preparation, but packaging verification remains incomplete until the sidecar is generated.

## Confirmed Separation Progress

The local changes correctly move Pillar Time away from shared Pillar runtime settings:

- Backend default port is now `42818`, not `42817` (`server/index.js`, `src-tauri/src/lib.rs`, `.env.example`).
- Runtime configuration now uses `PILLAR_TIME_*` variables instead of generic `PILLAR_*` variables.
- Reddit and Google Calendar connector env vars are scoped to `PILLAR_TIME_*`.
- A new guardrail test in `tests/runtimeSeparation.test.js` checks the dedicated port and blocks reintroduction of generic Pillar env names.

Remaining separation risk:

- The React brand component is still named `PillarBriefLockup`, and app assets still use `pillar-brief-*` filenames in `src/main.jsx`. This is not a runtime collision by itself, but it is an ongoing copy/paste risk and reinforces the old app identity in the codebase.
- Some lower-level brief setup and asset names still use old `brief` wording, but the default Today flow and workflow labels now use executive-day planning.

## Release Blockers

### P0 - Primary CTA dead-ends instead of producing an executive-day fallback

Status: fixed locally. Today now shows `Generate Day Plan`, calls `/api/workflow-runs` with `runType: "executive_day"`, and saves a deterministic executive day artifact when no model connector is configured.

Original live behavior: after onboarding and a successful Google Calendar connection, clicking `Generate Intelligence` stopped with:

`Brief generation stopped. Model connector is not ready`

Code evidence:

- Today page primary CTA is still `Generate Intelligence` and the page description includes "the intelligence brief" (`src/main.jsx:908`).
- The generation error screen renders `Brief generation stopped.` for any workflow error (`src/main.jsx:1963`).
- The model call throws immediately when model settings are not ready (`server/index.js:1518`).

Why it matters:

Pillar Time should be useful before optional AI/news setup. The expected default is an executive-day brief based on calendar, Linear, reminders, commitments, and deterministic analysis. A model-missing hard stop tells the user the app is broken after they just completed onboarding.

Required fix:

Make the Today CTA run the executive-day workflow, not the intelligence/news workflow. If the model connector is missing, render a deterministic day plan with schedule, commitments, risks, missing context, and setup nudges.

Verification after fix:

- Live API smoke on clean temp data with no model configured completed `executive_day` with status `completed`.
- Saved artifact title: `Executive day plan: 2026-06-24`.
- Generated brief explicitly said the model connector was not ready and rendered deterministic coverage notes instead of failing.
- `npm test` includes a guardrail that Today defaults to executive day planning while Intelligence still requests the old source workflow.

### P1 - Header/navigation overlaps at normal desktop widths

Status: fixed locally with a scoped responsive-header patch. The nav now scrolls inside its grid column instead of painting over the brand, and the wordmark scales down between `1181px` and `1360px` before the existing two-row header breakpoint takes over.

Original live behavior: on the main Today screen, the large Pillar Time wordmark overlapped the nav labels at the tested desktop app width.

Code evidence:

- The header renders the full brand lockup and dense grouped navigation on one row.
- The brand component is large and still based on Pillar Brief asset names (`src/main.jsx:382-388`).

Why it matters:

This is a first-screen polish and trust issue. The app looks broken before the user has any confidence in the deeper automation.

Required fix:

Add responsive header behavior: collapse nav earlier, reduce the wordmark footprint, or switch to icon plus product name at constrained widths. Add visual regression checks at desktop app widths.

Verification after fix:

- `npm run build` passed with the responsive header CSS.
- `npm test` passed.
- Automated screenshot geometry was not run because Playwright is not installed in this checkout and no new dependency was added for the audit. Before release, still run the recommended visual regression check at the installed app's default width.

### P1 - Empty Linear API key can be "saved" successfully

Status: fixed locally after this audit. The backend now rejects enabling Linear without a pasted, saved, or env-provided key, and the onboarding/settings UI shows a direct validation message instead of a success state.

Original live behavior: clicking `Save Linear` with an empty key reported `Linear connector saved.`

Code evidence:

- `saveLinearAccess` sends the current connector state without requiring an API key (`src/main.jsx:2831-2836`).
- The onboarding Linear step always enables the Save button (`src/main.jsx:3106`).

Why it matters:

This creates false confidence in a write-capable connector. It is especially risky because Linear is the connector the user expects to use for real work changes.

Required fix:

If there is no saved env key and no pasted key, show validation copy such as `Paste a Linear API key or skip Linear for now.` Only show success after a non-empty key is saved or an existing key is confirmed.

Verification after fix:

- `PATCH /api/connectors/linear` with `{ "enabled": true, "apiKey": "" }` returns `HTTP 400`.
- Response error: `Paste a Linear personal API key, or configure LINEAR_API_KEY before enabling Linear.`
- `npm test` includes a guardrail for this non-happy path.

### P1 - Executive operating system language still leaks into old news/source workflow

Status: fixed locally for the default Today flow. The Today page now uses `Generate Day Plan`, references the "latest successful day plan," and tells users to generate a day plan rather than intelligence to load the agenda. The optional Intelligence/Briefs screens still use source-brief language intentionally.

Original live behavior: Today said "Highest Leverage Today," but its empty state asked the user to connect "calendar and intelligence sources." Timeline said it was from the latest successful intelligence run.

Code evidence:

- Today page description references "the intelligence brief" (`src/main.jsx:908`).
- Timeline subcopy says "Calendar context from the latest successful intelligence run" (`src/main.jsx:929`).
- Empty agenda says "generate intelligence" to load calendar events (`src/main.jsx:930`).
- Workflow labels still include `fetch configured sources`, `normalize/dedupe items`, `score relevance/rising signal`, and `select top issues` (`src/main.jsx:63-69`).

Why it matters:

This is the exact product mismatch the user called out: Pillar Time reads as a news-report tool with calendar attached, not a day-management system.

Required fix:

Separate default executive-day generation from optional intelligence generation in labels, steps, endpoint calls, and empty states.

### P1 - Root URL recovery needs verification

Status: verified locally in production server mode.

Live behavior during audit: opening the bare root initially showed a plain `Not Found`; loading `/index.html#today` reliably opened the app. A later `curl /` returned the expected production HTML, so this may be a stale browser-tab/cache artifact from switching dev and production servers.

Code evidence:

- Production server does have a catch-all SPA fallback (`server/index.js:7248-7250`).

Required fix:

Before release, verify fresh Chrome, WebView, and installed DMG launches all land in the app at `/`, `/#/today`, and `/index.html#today`. If any path still shows bare `Not Found`, add an explicit root redirect and user-friendly backend-not-ready page.

Verification after fix/audit:

- Production server smoke on port `44000` returned `HTTP 200` and `text/html` for `/`, `/#/today`, `/index.html#today`, and `/missing-route`.
- Installed DMG/WebView launch should still be checked before release because this route smoke verifies the packaged server behavior, not macOS app launch state.

## High-Friction Findings

### P2 - Onboarding operating manual needs examples

Status: fixed locally. The profile step now includes a concrete example for protected hours, candor, meeting prep, follow-up, and decision tracking.

The profile step asks for an "Operating manual" with a placeholder list, but no sample or prompt shape (`src/main.jsx:3003-3008`). Users need help writing the exact context that makes the app valuable.

Fix: include one concise example and a "what good looks like" hint. Keep it optional.

### P2 - Calendar OAuth works, but trust copy needs one sentence

Status: fixed locally. The Calendar onboarding step now explains that Google may show Transformation Agency because Pillar Time uses a Transformation Agency auth broker for the local desktop OAuth handoff.

Google Calendar OAuth opened in Chrome and completed successfully. The callback was clear and the app updated automatically.

Friction: Google's consent page said it was continuing to `transformationagency.com`, while the app is Pillar Time. The backend uses the broker `https://auth.pillar.transformationagency.com` (`server/index.js:2580`).

Fix: before opening OAuth, say that a Transformation Agency auth broker is used to complete Pillar Time's local desktop connection.

### P2 - Calendar helper text remains stale after successful connection

Status: fixed locally. When the connector status becomes ready, the stale "consent opened" helper is replaced with `Google Calendar is connected.`

After Calendar connected, the onboarding helper still said "Google consent opened. When it says connected, return here and refresh status" (`src/main.jsx:2926`).

Fix: clear the pending helper message once `googleCalendarConnected` becomes true.

### P2 - Default model names need validation

Status: fixed locally for the known OpenAI mismatch. The frontend now defaults OpenAI to `gpt-4.1`, matching the backend default, instead of pre-filling `gpt-5.4-mini`.

The frontend defaults to `gpt-5.4-mini` and `grok-4.3` (`src/main.jsx:55-56`). If these are placeholders or not available for the user's provider, setup can fail late.

Fix: either use verified current defaults, fetch model options, or label these as editable examples.

### P2 - Final review button is vague

Status: fixed locally. The review step now shows `Fix required step` only when required onboarding is incomplete.

The final onboarding review always shows `Fix missing step` (`src/main.jsx:3255`). When only optional steps are missing, this is confusing.

Fix: hide it when no required steps are missing, or change it to `Review missing optional setup`.

### P2 - Schedule copy says "home screen"

Status: fixed locally. The copy now says settings can be changed from Settings.

The schedule step says settings can be changed from "the home screen" (`src/main.jsx:3239`), but the nav uses Today/Intelligence rather than Home.

Fix: say "Today" or "Settings."

### P2 - Reminder/review defaults need dependency clarity

Status: improved locally. Reminder channel rows now appear gated when Master reminders are off, the onboarding reminder step adds a "Quiet by default" notice, and review cadence labels now display human-readable text instead of raw slugs such as `weekly-kickoff`.

The reminder step exposes per-channel settings while a master reminder switch can be off. Review cadence names also expose internal IDs such as `weekly-kickoff` from seeded defaults (`server/index.js:3493`).

Fix: make disabled dependencies visually explicit and show human-readable review ritual names.

### P2 - CTA hover contrast needs a visual pass

Status: improved locally. Accent button hover/focus now keeps white text on a darker accent background instead of inheriting the generic light hover treatment.

In onboarding, the `Start Pillar Time` label/icon becomes hard to read on hover. This is a small but visible first-run quality issue.

Fix: adjust accent hover contrast and add a quick visual smoke test.

## Recommended Acceptance Tests

1. First-run no-model executive-day path:
   - Complete onboarding with no model and no intelligence sources.
   - Connect Google Calendar or use mocked calendar data.
   - Click `Generate Day Plan`.
   - Expect a deterministic executive-day report, not `Model connector is not ready`.

2. Linear empty-key validation:
   - On onboarding Linear step, click `Save Linear` with no key and no env fallback.
   - Expect validation warning and no success message.

3. Header visual regression:
   - Capture Today screen at 1024, 1280, 1440, and installed-app default width.
   - Assert brand/nav do not overlap and all nav controls remain reachable.

4. Route recovery:
   - Launch production server and installed desktop app.
   - Verify `/`, `/#/today`, and `/index.html#today` render the app instead of plain `Not Found`.

5. Calendar OAuth completion:
   - Mock or complete OAuth.
   - Verify the connector status changes to connected and stale "return and refresh" helper text clears.

6. Executive/intelligence separation:
   - Run default Today generation with zero news sources.
   - Verify no cached RSS/X/Reddit/news items appear.
   - Run Intelligence explicitly and verify the source pipeline remains available there.

7. Keyboard/accessibility smoke:
   - Tab through onboarding.
   - Confirm focus visibility, reachable skip/continue buttons, labeled inputs, and no keyboard traps.

8. Connector failure states:
   - Mock Calendar broker unavailable, Linear 400, Telegram token missing, update manifest unavailable.
   - Expect plain-language recovery copy and no false success messages.

## Suggested Minimal Fix Order

1. Rename the Today CTA to `Generate Day Plan` and route it to executive-day generation.
2. Add deterministic no-model executive fallback.
3. Fix Linear empty-key save validation.
4. Fix header/nav responsiveness.
5. Clean old intelligence copy from the Today path.
6. Add the route, Calendar helper, and onboarding copy tests.
7. Rename stale `PillarBriefLockup` symbols and asset filenames in a separate cleanup pass after runtime behavior is stable.

## Open Risks

- Packaging verification is incomplete until the Tauri sidecar is prepared and `cargo check` / desktop packaging run against the generated sidecar.
- Google Calendar OAuth was tested with a live local test database. The success path is real, but the release build still needs a clean-account smoke.
- No full Playwright automation was added in this audit pass; the findings are based on live manual browser QA plus source inspection.
