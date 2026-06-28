# UX Readiness Pass: Linear And Deliberation Busy Reasons

## Finding

- **P3: Work-surface refresh actions could be disabled without saying why.** Linear issue refresh and perspective deliberation regeneration both had busy disabled states but no recovery title, which can make a running refresh feel like an unresponsive button.

## Fix

- Added disabled-state reasons for Linear issue refresh and deliberation regeneration.
- Added runtime guardrails for both busy-state titles.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
