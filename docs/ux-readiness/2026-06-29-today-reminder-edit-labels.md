# Today Reminder Edit Labels

## Finding

Severity: P3

The Today page showed several upcoming reminders with identical "Edit" buttons. In the accessibility tree, the buttons did not identify which reminder they would edit, forcing keyboard and screen-reader users to infer the target from nearby text.

## Fix

- Added reminder-specific accessible names such as `Edit Morning command reminder`.
- Kept the visible button copy unchanged.
- Added a source-level guardrail with the other high-use control labels.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Packaged Today pass should expose reminder-specific edit button names.
