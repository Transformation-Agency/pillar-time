# Loading Status Semantics

## Finding

P3 - The generation screen and onboarding loading cards communicated progress visually, but they did not expose status, busy, or progressbar semantics. Screen-reader users could miss that Pillar Time was still working during day-plan generation, brief setup drafting, source suggestions, or other onboarding waits.

## Change

- Added `role="status"`, `aria-live="polite"`, and `aria-busy` to the generation panel.
- Converted the main generation progress meter into a real `progressbar` with min, max, current value, and day-plan-aware label.
- Added `role="status"`, `aria-live="polite"`, and `aria-busy="true"` to onboarding loading cards.
- Hid the decorative onboarding spinner from assistive tech.
- Added source-level regression coverage for the loading semantics.

## Verification

- `node --test tests/runtimeSeparation.test.js` should prove the loading semantics stay present.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A rendered packaged-app screen-reader pass should still confirm that the Tauri WebView announces these status regions naturally during a real generation run.
