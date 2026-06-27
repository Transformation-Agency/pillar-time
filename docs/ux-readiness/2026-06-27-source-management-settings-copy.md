# UX Readiness Pass - 2026-06-27 - Source Management Settings Copy

## Area

Settings page, Add connector modal.

## Finding

P2 - Settings still said source management was not exposed in this build.

After restoring the Sources route, that hint became false. A real user trying to repair source coverage from Settings could reasonably stop there and believe the app had no source-management surface.

## Fix

- Added a `Manage sources` option to the Add connector modal.
- The option closes the modal and opens `#sources`.
- Replaced the stale hint with `Source management is available from Context > Sources.`

## Evidence

- `node --test tests/runtimeSeparation.test.js`: pass.
- `npm test`: pass.
- `npm run build`: pass.
- `git diff --check`: pass.

## Recommended Regression Tests

- Keep the source guard that prevents the stale hidden-source copy from returning.
- Add a rendered Settings modal smoke later that clicks `Manage sources` and verifies the Sources page opens.
