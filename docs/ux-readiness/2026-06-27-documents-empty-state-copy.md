# UX readiness note: Documents empty state copy

## Finding

- **P3: Documents empty state promised upload without an upload control.** The Documents page currently supports creating documents by pasting text into the form. Its empty state said "Create or upload," which could send a first-run user looking for a missing upload affordance.

## Fix

- Changed the empty state to tell users to create a document by pasting text into the form.

## Verification

- Passed: `node --test tests/runtimeSeparation.test.js`
- Passed: `npm test`
- Passed: `npm run build`
- Passed: `git diff --check`
