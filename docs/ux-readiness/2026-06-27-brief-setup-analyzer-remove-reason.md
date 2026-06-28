# UX Readiness Pass: Brief Setup Analyzer Remove Reason

## Finding

- **P3: The analyzer remove action could disable without explaining why.** Brief Setup keeps at least one analyzer so generated briefs still have a perspective lens, but the disabled `Remove` button did not explain the rule.

## Fix

- Added a visible disabled-state title: `Keep at least one analyzer for generated briefs.`
- Guarded the remove handler so the final analyzer cannot be removed even if the disabled button state is bypassed.
- Added a source-level runtime separation guardrail for the disabled reason and data guard.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 64 tests passed.
- `npm test` - pass, 86 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This is a source-level copy and guardrail fix. A future rendered UI pass should still verify the title/tooltip placement in the packaged app.
