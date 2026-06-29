# Help Menu Focus Restore

## Finding

P3 - The Help/update menu supported Escape dismissal, but after closing the menu it did not explicitly restore focus to the Help trigger. Keyboard users could lose their place in the header after checking update status, opening help, or backing out of the menu.

## Change

- Added a `helpButtonRef` to the Help trigger.
- Changed Escape handling to prevent the default key action, close the menu, and return focus to the trigger.
- Added source-level regression coverage so future Help menu changes keep focus restoration.

## Verification

- `node --test tests/runtimeSeparation.test.js` should prove the Help menu focus-restoration guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A rendered packaged-app keyboard pass should still open Help, Tab through update actions, press Escape, and confirm focus visibly returns to the Help button in the Tauri window.
