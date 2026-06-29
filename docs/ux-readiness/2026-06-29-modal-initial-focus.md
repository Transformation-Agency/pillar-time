# Modal Initial Focus

## Finding

P2 - The main setup modals had dialog semantics, labeled close controls, and Escape dismissal, but they did not deliberately place focus inside the modal when opened. Keyboard and screen-reader users could remain on the underlying page and have to tab forward until they found the dialog.

## Fix

- Added initial focus to the first meaningful control in high-use setup modals.
- Source add/edit focuses the display-name input.
- Live preview focuses its close control because it is read-only.
- The connector picker focuses the first provider option.
- Credential setup modals focus the first credential field.
- Google Calendar setup focuses the primary connect/reconnect action.

## Evidence

- Added source-level regression coverage requiring these modal entry points to keep `autoFocus`.
- Existing tests still cover modal labels, dialog semantics, Escape dismissal, and unsaved-change guards.

## Remaining Verification

A packaged-app keyboard pass should still confirm focus order, screen-reader announcements, and background inertness. This pass does not add a focus trap.
