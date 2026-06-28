# UX readiness note: Perspective Lenses route

## Finding

- **P2: The Perspective Lenses editor existed but was not reachable.** The app contained a complete `Lenses` screen and tests for its controls, but `#lenses` was remapped to `briefSetup`, and the navigation only exposed Brief Setup. Users could not directly manage deliberation lenses after onboarding, even though the UI and persistence path existed.

## Fix

- Added `Perspective Lenses` to the Configure navigation group.
- Stopped remapping `#lenses` to Brief Setup.
- Added the existing `Lenses` component to the app route map.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
