# Planning Row Action Labels

## Finding

Severity: P3

Today’s Three, the Planner task backlog, and the Reminder List used repeated compact actions such as `Done`, `Remove`, `Archive`, `Enable`, `Disable`, and `Pause`. The visible layout was efficient, but keyboard and screen-reader users could land on repeated buttons without hearing which commitment, task, or reminder would be changed.

## Fix

Keep the visible button text short, but add item-specific accessible names and tooltips:

- `Mark <commitment> done`
- `Remove <commitment> from Today's Three`
- `Mark <task> done`
- `Archive <task>`
- `Enable/Disable <reminder>`
- `Pause <reminder> until tomorrow`
- `Archive <reminder>`

This makes planning actions understandable before the user changes the day plan or reminder schedule.

## Verification

- Added runtime guardrails requiring item-specific labels for Today commitments, Planner tasks, and Reminder row actions.
- Existing tests still verify local success/failure feedback and confirmation prompts for active planning changes.
