# Context Row Action Labels

## Finding

Severity: P3

Review template cards and document corpus rows used repeated actions such as `Enable`, `Disable`, `Archive`, and `Reactivate`. Those actions affect future reminders and retrieval context, so users need to know exactly which item will change before activating the button.

## Fix

Keep visible labels compact, but add item-specific accessible names and tooltips:

- `Enable <review template>`
- `Disable <review template>`
- `Archive <document> from active retrieval context`
- `Reactivate <document> for active retrieval context`

This improves keyboard and screen-reader clarity without changing the page layout.

## Verification

- Added runtime guardrails requiring review-template and document-specific action labels.
- Existing tests still verify confirmation prompts and local success/failure messages for these state changes.
