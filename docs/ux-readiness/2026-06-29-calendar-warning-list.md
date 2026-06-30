# Calendar Warning List

## Finding

P2 - In the running packaged app, Proposed Calendar warnings were rendered as one long paragraph. Important planning risks such as soft-context overlap, missing prep blocks, and stale Linear urgency were visually merged together under the calendar tiles.

Impact: a real user can miss or misunderstand the exact reason the proposed schedule needs review before approval.

## Change

- Rendered calendar planning warnings as a semantic `ul` with `aria-label="Calendar planning warnings"`.
- Kept each warning as its own list item instead of joining warnings into one sentence.
- Added spacing for adjacent warning items.
- Added a regression guardrail preventing the `classificationWarnings.join(" ")` rendering from returning.

## Verification

- Packaged app inspection via Computer Use showed the original one-paragraph warning problem on `#/today`.
- `node --test tests/runtimeSeparation.test.js` should prove the source guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A visual packaged-app pass should confirm the warning list reads cleanly at default, narrow, and wide desktop window widths after the next installed build.
