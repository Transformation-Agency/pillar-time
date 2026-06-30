# Settings Connector Action Labels

## Finding

Severity: P3

Settings rendered several repeated action buttons with only generic names such as "Set up" or "Edit." In the packaged app accessibility tree, Telegram, X, Google Calendar, Reddit, and Linear all exposed similar "Edit" buttons. Keyboard and screen-reader users had to infer the target from surrounding text, which is fragile in a dense setup/recovery page.

## Fix

- Added service-specific accessible names to model provider setup/change buttons.
- Added a service-specific accessible name to the Telegram connector edit button.
- Added service-specific accessible names to research connector edit/view buttons.
- Left visible copy and layout unchanged.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- Packaged Settings pass should expose names such as "Edit Google Calendar connector" and "Set up OpenAI model provider."
