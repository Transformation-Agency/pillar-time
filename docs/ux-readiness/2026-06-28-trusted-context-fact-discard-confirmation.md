# UX Readiness Pass - 2026-06-28 - Trusted Context Fact Discard Confirmation

## Area

Trusted Context page, add-profile-fact form.

## Finding

P2 - A user could start entering a trusted-context fact, including identity details, standing commitments, or trust settings, and lose the draft by navigating away before saving.

Trusted Context is part of the app's core memory and planning substrate. Silent loss here makes the app less trustworthy as a place to store important operating context.

## Fix

- Added a baseline for the trusted-context fact form.
- Set a page-level dirty flag while the fact draft differs from the saved baseline.
- Added a route-change confirmation before leaving Trusted Context with unsaved resource type, field key, value, or trust-setting edits.
- Clear the dirty flag after successful fact creation or confirmed discard.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded and build-verified. A rendered pass should type a profile fact, change trust settings, navigate away, cancel the discard prompt, confirm the draft remains, then repeat and accept the discard prompt.

