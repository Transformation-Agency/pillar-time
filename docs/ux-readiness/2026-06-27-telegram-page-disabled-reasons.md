# UX readiness note: Telegram page disabled reasons

## Finding

- **P2: Standalone Telegram page could send users into avoidable credential failures.** Settings already explains missing Telegram token/chat ID before saving, but the Telegram page's advanced manual form still allowed `Save Telegram Settings` while enabling the adapter with missing credentials. It also allowed `Send Test` before saved Telegram credentials existed, which could look like a broken app instead of an unfinished setup.

## Fix

- Added a `telegramSaveDisabledReason` on the Telegram page so enabling Telegram requires a bot token and chat ID before saving.
- Kept the disabled adapter path available so users can still turn Telegram off without credentials.
- Added a `telegramTestDisabledReason` so `Send Test` waits for saved, enabled Telegram credentials.
- Added button titles with the exact recovery action.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
