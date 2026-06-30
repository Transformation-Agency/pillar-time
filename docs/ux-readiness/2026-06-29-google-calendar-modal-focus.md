# Google Calendar Modal Initial Focus

## Finding

Severity: P2

The Google Calendar setup modal opened with focus on the bottom Connect/Reconnect action. In the packaged app this scrolled the modal past the permission explanation, reconnect warning, and current connector status. For a first-run or recovery path, that made the user land on an action before seeing why the permission was needed or what would happen.

## Fix

- Moved initial focus to the top "Close Google Calendar setup" control.
- Removed `autoFocus` from the bottom Google connect/reconnect action.
- Added a source-level guardrail so the reconnect action cannot accidentally regain initial focus.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Packaged-app visual pass should confirm the modal opens at the top with the permission explanation visible before the action row.
