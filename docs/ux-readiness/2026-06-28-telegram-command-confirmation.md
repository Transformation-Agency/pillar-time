# UX Readiness Pass: Telegram Command Confirmation

## Finding

- **P1: Telegram command tool calls could run with one click.** Some Telegram commands can approve or change workflow state. The in-app command tool is useful for testing, but it should not dispatch a command without explicit confirmation.

## Fix

- Added confirmation before running a Telegram command from the Telegram page.
- The confirmation explains that the command may approve or change local workflow state like a Telegram message.
- Added a disabled reason and hover title when no command is selected.

## Guardrail

- Updated the Telegram runtime guardrail to require command confirmation, failure feedback, and the command disabled affordance.

## Verification

- `node --test tests/runtimeSeparation.test.js` passed: 73 tests.
- `npm test` passed: 95 passed, 1 opt-in Linear smoke test skipped.
- `npm run build` passed.
- `git diff --check` passed.
