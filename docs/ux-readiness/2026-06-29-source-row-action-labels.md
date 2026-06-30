# Source Row Action Labels

## Finding

Severity: P3

The Sources table used repeated generic controls: `Active`, `Paused`, `Edit`, and `Delete`. For keyboard and screen-reader users, those controls did not identify which source would be changed or deleted. This is especially risky because deleting a source removes it from future runs.

## Fix

- Added source-specific accessible names for pause/resume controls.
- Added source-specific accessible names for edit and delete controls.
- Kept visible table layout and button text unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Packaged Sources pass should expose names such as `Edit BBC` and `Delete BBC` instead of repeated generic labels.
