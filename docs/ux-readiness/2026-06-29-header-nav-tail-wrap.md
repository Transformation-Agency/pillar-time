# Header Nav Tail Wrap

## Finding

P2 - After moving the medium-width nav to its own row, packaged-app verification showed the left side was fixed but the far-right route labels could still clip at the default desktop width.

Impact: important routes such as Perspective Lenses or Settings-adjacent recovery paths can appear partially cut off, making the app feel less trustworthy during setup and recovery.

## Change

- At medium desktop widths, the nav row now wraps instead of staying as a single clipped scroll row.
- The nav gets `height: auto`, a `min-height`, visible overflow, and bottom padding so wrapped route labels remain readable.
- Updated the CSS guardrail to require the medium-width wrap behavior.

## Verification

- Packaged app inspection after PR #156 showed remaining tail clipping in the header.
- `node --test tests/runtimeSeparation.test.js` should prove the CSS guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A packaged visual pass should verify the header after reinstall at default, 1280px, 1360px, and wide desktop widths.
