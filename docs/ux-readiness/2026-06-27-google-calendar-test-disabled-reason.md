# UX readiness note: Google Calendar test disabled reason

## Finding

- **P3: Google Calendar setup exposed `Test` before Calendar was connected.** The modal already had fallback error copy, but a first-run user could still click `Test` while disconnected and get a predictable backend failure instead of clear setup guidance.

## Fix

- Added a Settings Google Calendar disabled reason for `Test` while the connector is not ready.
- Kept the Connect/Reconnect action available as the correct recovery path.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
