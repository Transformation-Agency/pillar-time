# UX Readiness Pass - 2026-06-27 - Telegram Command Feedback

## Area

Telegram command tool and manual Telegram recovery actions.

## Finding

P3 - Telegram command execution could fail without visible feedback.

The Telegram page includes a command tool for testing command routing. It directly called `/api/telegram/commands` and only rendered a result on success. If the backend rejected the command, the user could click `Run Command` and see no useful recovery message. Manual save and test actions also relied on raw error messages without fallback copy.

## Fix

- Clear stale command output before running a command.
- Show `<command> command completed.` when the command succeeds.
- Show the backend error or `Could not run Telegram command.` when it fails.
- Added fallback error copy for manual Telegram save and test actions.
- Added a regression guard against restoring the one-line command runner.

## Evidence

- `node --test tests/runtimeSeparation.test.js` - pass, 43 tests.
- `npm test` - pass, 65 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Recommended Regression Tests

- Add a rendered Telegram-page test later that mocks failed command execution and verifies the warning appears while old command output is cleared.
