# UX Readiness Pass - 2026-06-27 - External Link Fallback

## Area

First-run setup, Settings connector setup, Help/update setup links, Linear issue links, Telegram bot setup links, model-provider links, and Calendar OAuth recovery.

## Finding

P2 - External setup/help links could fail without visible recovery in many flows.

The shared `openExternalUrl` helper tried the backend desktop opener and then `window.open`, but most callers did not have their own local error message. If the desktop opener failed and the browser fallback was blocked or unavailable, a real user could click `Get key`, `Docs`, `Open X portal`, `Open bot setup guide`, or a Linear issue link and see nothing useful.

## Change

- Added a copyable external-link fallback notice in the app shell.
- Updated `openExternalUrl` to detect blocked `window.open` fallback attempts.
- Dispatches a shared `pillar-time:external-link-fallback` event so every existing setup/help link gets the same visible recovery path.
- The notice tells the user to copy the URL into their browser and includes a `Dismiss` button.
- Expanded the plain-English user manual with a table of contents, quick feature map, mental-clutter rule, overwhelmed-start path, and explicit Generate Day Plan behavior.

## Why This Matters

First-run setup depends on external pages for model keys, Telegram bots, Google consent, X credentials, docs, and issue links. If opening those pages silently fails, setup becomes a dead end. A copyable URL is a simple escape hatch that keeps the user moving without changing the connector architecture.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 44 passed.
- `npm test` - pass, 66 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified, not a packaged macOS window test. A future keyboard/visual pass should click at least one external link with browser opening blocked and confirm the notice is visible and readable at the default desktop window size.
