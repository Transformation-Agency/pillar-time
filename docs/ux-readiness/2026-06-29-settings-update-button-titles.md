# Settings Update Button Titles

## Finding

P3 - Settings exposed the signed desktop update controls, but the state-specific `Install` and `Restart` buttons did not carry explanatory titles. The Help menu path already explains update actions more clearly, so Settings was slightly weaker for keyboard and assistive-technology users reviewing install-adjacent actions.

## Change

- Added a title to the Settings `Install` button: `Install the signed desktop update`.
- Added a title to the Settings `Restart` button: `Restart Pillar Time to finish updating`.
- Extended the desktop update guardrail to require both Settings titles.

## Verification

- `node --test tests/runtimeSeparation.test.js` should prove the Settings update button copy guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A packaged-app update pass should still verify the full signed-update path across cancel, install, installed, restart, and failure states.
