# Approval Action Labels

## Finding

Severity: P2

The Approvals page used repeated visible actions named `Approve`, `Reject`, and `Execute` for every approval row. That was understandable visually when the user could scan the row, but it was ambiguous for keyboard and screen-reader users moving through repeated controls. It was also risky because `Execute` can perform approval-gated writes to Google Calendar or Linear.

## Fix

Keep the compact visible labels, but give each approval action a specific accessible name and tooltip that includes the approval title:

- `Approve <approval title> for later execution`
- `Reject <approval title> without executing it`
- `Execute <approval title> now`

This preserves the existing page layout while making the action target explicit before a user changes approval state or triggers an external write.

## Verification

- Added a runtime separation guardrail test requiring approval-specific `aria-label` and `title` values.
- Existing approval tests still verify that rejected/executed actions show local success or failure messages and that execution remains a separate explicit step after approval.
