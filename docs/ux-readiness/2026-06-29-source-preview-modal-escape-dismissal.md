# Source And Preview Modal Escape Dismissal

## Finding

P2 - The source editor and brief live preview modals had labeled close controls and dialog semantics, but they did not support Escape-key dismissal. This left keyboard-first users without the common recovery path on two modal surfaces used during setup and brief configuration.

## Fix

- Added Escape-key dismissal for the source add/edit modal.
- Routed source Escape dismissal through the existing `closeSourceForm` guard, preserving the discard confirmation for unsaved source name, type, and locator edits.
- Added Escape-key dismissal for the brief live preview modal.

## Evidence

- Added source-level regression coverage for both modal listeners.
- `node --test tests/runtimeSeparation.test.js` should prove the new keyboard handlers remain present.

## Remaining Verification

A rendered keyboard pass should open the source editor, type a feed/search locator, press Escape, cancel the discard prompt, and confirm the typed locator remains. It should also open Live preview and confirm Escape closes it without changing the saved brief setup.
