# UX Readiness Pass - 2026-06-29 - Local Data Export

- Area: Settings, recovery and migration.
- Severity: P2.
- Status: fixed.

## Finding

Pillar Time stores high-value local context: profile facts, standing commitments, tasks, documents, approvals, and audit history. A real user needs a clear recovery path if they are moving machines, troubleshooting, or asking for support.

Before this pass, Settings did not provide an explicit local data export. That made the app feel more fragile than a local-first executive operating system should feel.

## Change

- Added `POST /api/export/local-data`.
- The export returns a versioned `pillar-time.local-data-export.v1` JSON object built from the existing sanitized app state.
- Added an audit log entry when a local export is created.
- Added a Settings `Local Data Export` panel.
- Added confirmation copy before export because the file can contain private planning/profile context.
- Added visible success and failure messages, a busy state, and a disabled-state title.

## Verification

- `node --test tests/runtimeSeparation.test.js`
- `npm test`
- `npm run build` in a clean patched control worktree
- Temporary backend smoke: `POST /api/export/local-data` returned `schema: "pillar-time.local-data-export.v1"` and included a `local_data.exported` audit entry.
- Source guard requires the endpoint, audit event, private-data warning copy, confirmation prompt, JSON download filename, and disabled-state title.

Note: the primary working tree contains ignored `dist/` debris with a pathological generated directory that caused local Vite cleanup/build commands to hang. The same patched source built successfully in a clean worktree.

## Follow-up

This is export-only. A later migration pass should design a careful import flow with preview, conflict handling, and explicit approval before writing imported facts or tasks into the local database.
