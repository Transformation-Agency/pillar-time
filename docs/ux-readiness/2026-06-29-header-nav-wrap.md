# Header Nav Wrap

## Finding

P2 - In the packaged app at the default desktop window width, the header navigation could visually clip around the logo/nav labels instead of presenting a stable, readable route list.

Impact: a first-run or recovery user can lose confidence if primary navigation appears partially cut off, especially in Settings where connector and update recovery actions live.

## Change

- At medium desktop widths (`1181px` to `1360px`), the header now uses a two-row layout.
- Brand and Help remain on the first row.
- The route nav moves to a full-width second row before labels start clipping.
- Added a CSS guardrail test for the medium-width header/nav layout.

## Verification

- Packaged app inspection showed the clipped header state on `#/settings`.
- `node --test tests/runtimeSeparation.test.js` should prove the responsive CSS guardrail.
- `npm test` should keep the broader UX and backend guardrails green.

## Remaining Verification

A packaged visual pass should verify the header at default, 1024px, 1280px, 1360px, and wide desktop widths after the next installed build.
