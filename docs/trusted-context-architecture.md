# Trusted Context Architecture

Pillar Time's Trusted Personal Context subsystem turns stable, source-backed knowledge about a person into bounded context that agents can safely use. It is not a biography field, memory dump, prompt preamble, or generic notes store.

The governing rule is:

> Stable context explains how to interpret live data. Live data establishes what is true now.

This subsystem must answer:

- what is true, was true, or will be true for a specific time frame
- who or what supplied the information
- when the system learned it
- how reliable it is
- where it may be disclosed
- whether it has been superseded
- whether it is safe to use for the current action

## Product Boundary

Trusted Context extends the Executive Operating System architecture in [executive-operating-system.md](executive-operating-system.md). It does not replace the canonical executive record, connector platform, approval system, audit log, or policy engine. It provides the context stack and contracts those systems use.

The first implementation should support Personal Desktop Mode with local SQLite persistence and durable local audit. The contracts also reserve workspace-safe fields for Executive Workspace Mode so Agent B can build persistence without later schema breakage.

## Context Stack

Every consequential agent workflow assembles context from explicit layers. These layers are stored, authorized, retrieved, and audited separately.

### 1. Platform Constitution

Immutable application protections enforced by code:

- authorization and workspace isolation
- professional/personal partition separation
- field-level privacy and disclosure checks
- approval enforcement
- typed connector execution only
- prohibition on direct model-driven tool execution
- secret and vault-reference handling
- prompt-injection defenses for connected content
- audit requirements

Workspace administrators and users cannot weaken this layer.

### 2. Workspace Context Constitution

A visible, versioned constitution that defines local workspace behavior:

- instruction hierarchy
- truth and uncertainty rules
- privacy and approval behavior
- communication baseline
- source-of-truth principles
- prohibited assumptions
- profile learning rules
- rules for speaking to, for, or about a person

Updates must create a new version, show a diff, identify the editor, record the reason, preserve the prior version, and emit an audit event.

### 3. Identity And Role Kernel

A compact, high-confidence context slice suitable for nearly every consequential request. It contains only the identity and role fields required to interpret tasks.

Allowed fields include unique person ID, preferred name, formal name, pronouns, name pronunciation, current title, organization, primary responsibilities, primary time zone, usual locations, preferred language, relevant accessibility requirements, active roles, role effective dates, historical roles, source references, and verification status.

The kernel must not contain passwords, tokens, passport numbers, payment data, complete loyalty credentials, raw private notes, unrestricted biographies, or unnecessary family details. It may include secure resource identifiers or vault references when the current actor is authorized.

### 4. Canonical Profile

Structured profile resources that describe durable context:

- identity and roles
- source authority
- privacy and disclosure
- authority and approvals
- scheduling and time policy
- communication style
- priorities and goals
- people and relationships
- organizations and projects
- life and travel preferences
- important dates and rituals
- decision principles and confirmed positions
- meeting playbooks
- approved examples

Agents retrieve only task-relevant slices. Canonical profile data is not automatically current if a connected system supplies newer live state.

### 5. Live Operating State

Time-sensitive state from authorized systems such as calendar, commitments, tasks, messages, reservations, project state, current location when authorized, destination time zone, travel disruption, and sync status.

Every live snapshot must include source, connector account, retrieval time, source data timestamp where supplied, freshness classification, synchronization state, unresolved errors, and applicable access scope. Cached data must disclose age and cannot be represented as live.

### 6. Episodic Memory

Relevant historical episodes, including prior decisions, approved exceptions, previous drafts, meeting outcomes, resolved conflicts, planning outcomes, scheduling precedents, examples of correct communication, and previous user corrections.

Episodic memory is retrieved by relevance and authorization. Complete history must not be placed into every model request.

### 7. Learned Profile

Patterns detected by the system remain separate from confirmed facts. A learned pattern may produce an observation, inference, proposed profile update, or proposed policy. It cannot silently become a confirmed preference or policy.

## Trust Hierarchy

The default hierarchy, highest trust first:

1. Immutable platform safety and security rules
2. Safety, privacy, legal, and organizational policy
3. Current authenticated user instruction
4. Approved temporary override
5. Authoritative live system for the field
6. Verified canonical profile
7. Confirmed historical decision
8. Approved behavioral pattern
9. Imported but unverified information
10. Observation
11. Inference
12. Generic application default

Field-specific authority may refine lower levels but cannot weaken platform safety, privacy, access control, legal constraints, or explicit approval requirements.

## Source Authority Model

Authority is field-specific, not provider-wide. For example, Google Calendar may be authoritative for event start/end, while the canonical profile may be authoritative for a person's preferred communication style.

Each authoritative rule declares:

- resource type
- field path or field group
- primary authority
- fallback authorities in order
- partitions covered
- effective interval
- conflict policy
- approval requirement for changes
- permitted writers

When live and stable context conflict, the resolver applies the field-specific rule and preserves both records as evidence. It must not silently overwrite source evidence or merge uncertain facts.

## Canonical Resource Model

All profile resources share a common wrapper:

- stable internal ID
- workspace ID
- subject person ID
- resource type
- professional/personal partition
- lifecycle status
- source provenance
- bitemporal validity
- visibility policy
- AI-processing permission
- confidence and verification state
- supersession links
- audit references
- external references when applicable

The canonical model stores facts as individually addressable records when field-level provenance, validity, privacy, or conflict resolution matters. A profile page may present a friendly view, but storage and context assembly must remain fact-aware.

## Profile Facts

A profile fact is the smallest durable claim that can be independently sourced, verified, disclosed, superseded, or used in a context envelope.

Examples:

- "Preferred name is Paul"
- "Primary time zone is America/Denver"
- "Do not schedule deep work before 10:00 on Mondays"
- "For investor updates, use concise direct language"
- "Assistant X may create tentative internal holds until 2026-07-31"

Every profile fact includes assertion time, valid time, source evidence, reliability, confidence, verification status, privacy scope, disclosure rules, and supersession state.

## Context Envelopes

Agents do not directly read arbitrary profile records. They request a context envelope for a declared interaction mode, task, actor, subject, audience, channel, partition, action type, risk level, and time horizon.

The context assembler returns:

- identity kernel
- applicable constitution versions
- selected canonical facts
- authorized live snapshots
- relevant episodic memory
- learned observations and proposals when allowed
- source citations and evidence pointers
- exclusions and redactions
- freshness and quality signals
- unresolved conflicts
- approval and disclosure constraints

No model call may omit its interaction mode or temporal frame.

## Interaction Modes

Every consequential request declares one mode:

- `speaking_to_subject`
- `speaking_for_subject`
- `speaking_about_subject`
- `internal_administrative_action`

Mode determines which private facts may be used, which facts may be disclosed, and which approval preflights are required.

### Speaking To Subject

May use private context that the authenticated subject is permitted to access. It may include sensitive context if necessary for the requested task and allowed for AI processing.

### Speaking For Subject

Requires explicit authority, verified facts, approved communication policy, audience-specific disclosure checks, stricter preflight, and approval when externally visible. It must not use inferred opinions or unconfirmed commitments as if they are the subject's position.

### Speaking About Subject

May expose only facts permitted for the named audience and channel. It must treat private facts as unavailable unless explicitly permitted for that audience.

### Internal Administrative Action

May use only context required for the operation and must still satisfy authorization, privacy, AI-processing, audit, and approval rules.

## Temporal Semantics

Trusted Context is bitemporal:

- valid time: when the fact was or will be true in the real world
- transaction time: when Pillar Time learned, changed, superseded, or forgot the fact

Context envelopes include current date, current time, primary time zone, event time zone when relevant, destination time zone when relevant, current location when authorized and necessary, requested horizon, last connector sync timestamps, stale sources, and unresolved temporal conflicts.

Use IANA time-zone identifiers. Do not rely on a global server timezone for user-facing interpretation.

## Permission Semantics

Permissions are capability-based and evaluated before retrieval, context assembly, AI processing, disclosure, and external action.

Permission checks include:

- actor capability
- subject consent or delegation
- workspace and partition
- field-level visibility
- audience and channel
- interaction mode
- risk level
- external visibility
- AI-processing permission
- vault-reference permission
- export/delete restriction
- approval requirement
- delegation expiration and revocation

Busy-only private events expose only start, end, busy status, and optional travel constraint. They do not expose title, description, attendees, location, attachments, conference links, notes, or redacted details to AI providers.

## Privacy And Security Boundaries

Connected content is untrusted. Prompt-like text from email, chat, documents, calendar descriptions, web pages, meeting transcripts, and task descriptions must be carried as quoted evidence, not as instructions.

Secrets and sensitive identifiers must live in the vault or secure storage. Context envelopes may include vault references only when the operation is authorized, but must not include raw passport numbers, payment-card data, access tokens, raw credentials, or unnecessary private-event details.

AI may extract, match, summarize, rank, draft, and propose updates. AI must not execute connector actions. All AI output passes through schema validation, authorization, policy evaluation, approval determination, typed execution, verification, and audit.

## Module Boundaries

Recommended implementation modules:

- `trusted-context/contracts`: shared enums, schema validators, event names, and TypeScript-style types
- `trusted-context/store`: persistence for resources, profile facts, provenance, versions, snapshots, and proposals
- `trusted-context/authority`: field authority registry and source reconciliation
- `trusted-context/permissions`: retrieval, disclosure, AI-processing, and vault-reference checks
- `trusted-context/assembler`: context envelope construction and quality analysis
- `trusted-context/memory`: episodic memory, observations, inferences, proposals, rejection, and expiration
- `trusted-context/events`: event publication, audit mapping, idempotency, replay, and dead-letter contracts
- `trusted-context/ui`: profile, rules, authority, conflict, proposal, and context-health interfaces
- `trusted-context/integrations`: adapters from Today, briefings, meetings, commitments, relationships, approvals, travel, and drafting workflows

Product workflow modules must consume assembled envelopes and service interfaces. They must not query trusted-context storage directly.

## Event Flow

The subsystem follows the Executive Operating System automation pipeline:

Trigger -> normalize event -> retrieve authorized context -> evaluate policies -> generate proposed action -> determine approval requirement -> request approval when required -> execute through typed connector action -> verify external result -> audit.

Trusted Context contributes retrieval, reconciliation, quality analysis, proposed profile updates, permission filtering, and context citations. It never bypasses policy or approval.

## Acceptance Requirements

An implementation is not complete until it demonstrates:

- separate storage and retrieval for the seven context layers
- field-specific provenance, validity, and source authority
- context envelopes for all four interaction modes
- permission filtering across partitions, audiences, AI processing, and disclosures
- explicit stale-source and conflict handling
- proposed profile updates rather than silent learning
- audit events for context reads, writes, redactions, conflicts, approvals, and exports
- tests for prompt injection, private-event redaction, stale live data, conflicting sources, unauthorized assistant access, speaking-for-subject preflights, and superseded facts
