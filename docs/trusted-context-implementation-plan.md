# Trusted Personal Context Implementation Plan

This plan implements a release-quality Personal Desktop Mode slice of Trusted Personal Context while preserving the Executive Workspace architecture boundary.

Governing rule:

> Stable context explains how to interpret live data. Live data establishes what is true now.

## Baseline

- `/mnt/data` optional source files were not present in this environment.
- Existing repo docs read: Executive Operating System architecture and Pillar Time implementation notes.
- Baseline `npm test` and `npm run check` passed before implementation.

## Workstream Boundaries

- Agent A owns architecture/contracts docs.
- Agent B responsibilities are implemented by the integration lead in `server/index.js` migrations and persistence APIs.
- Agent C responsibilities are implemented in `server/trustedContext.js` and backend envelope assembly.
- Agent D responsibilities are implemented as permission/filtering/redaction checks in `server/trustedContext.js` plus adversarial tests.
- Agent E responsibilities are implemented in `src/main.jsx` Trusted Context UI.
- Agent F responsibilities are implemented through Today and workflow artifact context envelope integration.
- Agent G owns adversarial trusted-context tests.
- Agent H responsibilities are covered by docs, fixtures, and release notes added in this pass.

## Phase 1: Contracts And Schema

1. Define trust levels, interaction modes, partitions, visibility levels, fact statuses, and context envelope shape.
2. Add SQLite tables for:
   - workspace context constitution versions
   - profile facts with bitemporal validity
   - provenance records
   - live context snapshots
   - episodic memories
   - memory/profile proposals
   - context envelope snapshots
3. Add seed constitution and verified identity facts from existing Pillar Time profile.

## Phase 2: Context Assembly

1. Build a pure context module that:
   - validates requests
   - sorts by trust hierarchy
   - filters by partition, audience, mode, and visibility
   - redacts prompt-injection-like source content
   - classifies live snapshot freshness
   - builds task-specific context envelopes
   - emits quality warnings
2. Persist built envelopes for audit/debugging.

## Phase 3: Product Integration

1. Add `/api/trusted-context` endpoints for state, facts, constitution updates, proposals, and envelope preview.
2. Add a Trusted Context UI for:
   - identity kernel
   - profile facts
   - source/provenance
   - memory proposals
   - context health
   - envelope preview
3. Include a context envelope in Today suggestions and daily brief artifacts.

## Phase 4: Security And Tests

1. Add unit/adversarial tests for filtering, redaction, stale data, proposed-versus-verified facts, and envelope warnings.
2. Run app build and backend smoke checks.
3. Review actual diffs for security/privacy and architecture/data integrity issues.

## Current Deferrals

- Executive Workspace Mode collaboration, server-side queues, and delegated assistant views.
- Encrypted sensitive vault storage.
- Full connector webhook normalization.
- Model-provider context injection across every LLM call.
- UI for full conflict merge/split workflows.

These are architecture commitments and should not be represented as fully implemented in the app.
