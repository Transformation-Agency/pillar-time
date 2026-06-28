# Onboarding Rail Current Step Semantics - 2026-06-28

## Finding

P3 - The onboarding step rail showed the active step visually but did not expose the current step semantically.

Keyboard and screen-reader users need the same orientation sighted users get from the active styling. Without `aria-current`, the rail is less clear during first-run setup.

## Fix

- Added `aria-current="step"` to the active onboarding rail button.
- Kept the existing visual styling and persisted `go(id)` navigation unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build`
- `git diff --check`

## Residual Risk

This is source-guarded. A later keyboard/screen-reader pass should confirm the rail is announced well in the packaged app WebView.
