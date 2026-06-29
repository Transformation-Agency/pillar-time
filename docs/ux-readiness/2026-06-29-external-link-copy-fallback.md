# UX Readiness Pass - 2026-06-29 - External Link Copy Fallback

- Area: external setup links, OAuth/key/docs recovery.
- Severity: P3.
- Status: fixed.

## Finding

When Pillar Time could not open an external link automatically, the fallback banner told the user to copy the URL manually. That is better than a silent failure, but it still leaves users selecting text by hand during setup recovery.

This matters for OAuth, API key, documentation, and external issue links because those are often the exact moments where a user is already blocked.

## Change

- Added a `Copy URL` button to the external-link fallback banner.
- Added success feedback: `URL copied.`
- Added fallback failure copy when clipboard access is unavailable.
- Clearing the banner also clears stale copy feedback.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Updated the external-link fallback guardrail to require the clipboard copy path and failure copy.
