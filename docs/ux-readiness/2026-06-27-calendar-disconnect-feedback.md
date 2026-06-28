# UX Readiness Pass - 2026-06-27 - Calendar Disconnect Feedback

## Area

Settings > Google Calendar connector modal.

## Finding

P2 - Google Calendar disconnect could fail without visible recovery.

The disconnect action correctly asked for confirmation before removing Calendar access. After confirmation, though, it awaited `/api/google-calendar/disconnect` without a local `try/catch`. If the backend was unavailable or rejected the request, the user could be left in the connector modal with no clear message about whether Calendar was still connected.

## Change

- Wrapped Google Calendar disconnect in a local `try/catch`.
- Preserved the existing confirmation and success message.
- On failure, the modal now shows the backend error or `Could not disconnect Google Calendar.`
- Added a runtime-separation guard so the disconnect path does not regress to an unhandled mutation.

## Why This Matters

Disconnecting Calendar affects one of the most important trust boundaries in Pillar Time: schedule access and approved calendar writes. A failed disconnect must be explicit so a user can trust whether the app still has Calendar access.

## Verification

- `node --test tests/runtimeSeparation.test.js` - pass, 45 passed.
- `npm test` - pass, 67 passed, 1 skipped live Linear smoke.
- `npm run build` - pass.
- `git diff --check` - pass.

## Remaining Risk

This is source-guarded and build-verified, not a live OAuth disconnect smoke. A future packaged-app pass should connect a disposable Google Calendar account, simulate a backend failure during disconnect, and confirm the warning remains visible in the modal.
