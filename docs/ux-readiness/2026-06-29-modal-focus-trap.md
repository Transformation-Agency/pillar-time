# Modal Focus Trap

## Finding

P2 - Modal dialogs exposed `role="dialog"` and `aria-modal="true"`, placed initial focus inside the active panel, and supported Escape dismissal, but Tab focus could still move into controls behind the modal. That made credential, source, and live-preview recovery flows less predictable for keyboard-only users.

## Change

- Added a shared `useModalFocusTrap(active)` hook.
- Marked the source editor, live preview, connector picker, and Settings connector setup dialogs with `data-modal-focus-trap="true"`.
- Kept existing guarded close paths intact, so source edits, credentials, and calendar selections still ask before being discarded.
- Added source-level regression coverage proving the trap listener, wrap behavior, and all current modal markers remain present.

## Verification

- `node --test tests/runtimeSeparation.test.js` should prove the source-level keyboard trap guardrails.
- `npm test` should keep the broader backend/frontend guardrail suite green.

## Remaining Verification

A rendered packaged-app keyboard pass should still open each modal, Tab through the controls, confirm focus wraps inside the dialog, press Escape, and confirm screen-reader announcements in the Tauri WebView.
