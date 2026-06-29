# Boot Error Alert

## Finding

P3 - The local-backend failure screen had clear copy and a retry button, but it was rendered as ordinary page content. During install, update, or backend startup failure, screen-reader users may not be told that the app entered an error state.

## Change

- Marked the backend failure screen as `role="alert"` with `aria-live="assertive"`.
- Added a recovery-oriented title to the retry control.
- Extended the backend connection recovery guardrail to require the alert semantics and retry title.

## Verification

- `node --test tests/runtimeSeparation.test.js` should prove the backend error alert guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A packaged-app assistive-technology pass should still force the backend-offline state and confirm the alert is announced naturally in the Tauri WebView.
