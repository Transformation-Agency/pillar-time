# UX Readiness Pass - 2026-06-27 - Onboarding Brief Disabled Reasons

## Area

First-run onboarding, optional intelligence brief setup and source suggestion steps.

## Finding

P3 - Onboarding buttons hid the reason they were disabled.

The optional intelligence setup flow uses a minimum request length before it can generate a brief setup or source suggestions. The disabled buttons did not explain that the user needed at least 20 characters. `Apply and continue` also disabled when no draft existed, but did not say that a draft needed to be generated first.

## Change

- Added named disabled-state reasons for onboarding brief setup actions.
- `Generate brief setup` now explains when the request is too short or a draft is already running.
- `Apply and continue` now explains when the user needs to wait or generate a draft first.
- `Generate` source suggestions now explains the same request-length rule.
- `Add selected` now explains whether suggestions are still running, saving, or not generated yet.
- Added runtime-separation guard coverage.

## Why This Matters

First-run setup is where users decide whether the app feels understandable. Hidden thresholds make the app feel arbitrary. Clear button reasons let users recover without guessing or leaving the flow.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 48 passed.
- `npm test` - pass, 70 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified. A rendered onboarding pass should confirm the title/help text is discoverable enough with keyboard focus and that it does not crowd the compact first-run layout.
