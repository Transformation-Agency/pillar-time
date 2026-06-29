# Settings Modal Escape Dismissal

## Finding

P2 - Settings connector setup modals had dialog semantics and labeled close controls, but keyboard users still needed to tab to Cancel or the close button to recover from an opened modal. This affected the connector picker and credential-heavy setup flows for model providers, Telegram, X, Reddit, Linear, and Google Calendar.

## Fix

- Added Escape-key dismissal while any Settings connector modal is open.
- Routed Escape through the same close handlers used by Cancel, close buttons, and backdrop clicks.
- Preserved existing unsaved-change confirmations for pasted API keys, Telegram settings, Linear setup, Reddit credentials, and Google Calendar selections.

## Evidence

- Added a source-level regression test that requires the Settings modal Escape listener and verifies it calls the guarded close handlers.
- Existing modal accessibility tests still require close labels and dialog semantics.

## Remaining Verification

A rendered keyboard pass should open each Settings modal, type into credential/calendar fields, press Escape, cancel the discard confirmation, and confirm the modal remains open with the typed value intact.
