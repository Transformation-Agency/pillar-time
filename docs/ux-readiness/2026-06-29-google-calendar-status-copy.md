# Google Calendar Connected Status Copy

## Finding

Severity: P3

When Google Calendar had read access but needed a reconnect for write access, the setup modal headline said "Google Calendar read access ready" while the body text still said "Connect Google." That mixed disconnected and connected states in the same notice, making the recovery path feel less trustworthy.

## Fix

- Added state-aware fallback copy for disconnected, read-only, and read/write calendar states.
- Kept connector errors and action messages higher priority than fallback copy.
- Added a source-level guardrail so connected states do not reuse the disconnected fallback sentence.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Live packaged check should show read-only status copy that starts with "Read access is connected."
