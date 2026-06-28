# UX Readiness: Settings Telegram Save Disabled Reason

## Finding

- **P3: Settings Telegram setup could leave `Save Telegram` active without the required token or chat ID.** The modal had fallback error copy after failed saves, but users could still click the primary save action before the required fields were present.

## Fix

- Added a disabled-state reason for missing Telegram bot token.
- Added a disabled-state reason for missing Telegram chat ID.
- Added a source-level guardrail for both recovery messages and the disabled button title.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 65 tests passed.
- `npm test` - pass, 87 tests passed and 1 live Linear smoke test skipped as opt-in.
- `npm run build` - pass, Vite production build completed.
- `git diff --check` - pass.

## Remaining Risk

This fixes the Settings connector modal. A later pass should review the standalone Telegram page's advanced manual settings form.
