# Executive Operating System Architecture

Pillar Time is not primarily a calendar, task manager, reminder app, or AI chat interface. It is an Executive Operating System.

Every feature should fit into at least one of these layers:

1. **Executive record**: the canonical record of commitments, relationships, preferences, meetings, travel, important dates, priorities, policies, and planning history.
2. **Connected systems**: the apps where communication, scheduling, projects, documents, meetings, and logistics already occur.
3. **Policy-controlled automation**: a pipeline that detects events, retrieves authorized context, proposes actions, obtains required approval, executes through typed connectors, verifies external results, and records audit events.

Do not build disconnected dashboards. Data extracted from email, calendar, meetings, chat, tasks, documents, or travel must normalize into the same executive data model.

## Current Implemented Loop

The Personal Desktop Mode build now exposes the first visible version of the constitutional operating loop on Today:

1. The morning brief remains a first-class planning ritual and, when available, feeds the Today recommendation context.
2. "What Should I Do Now?" produces one primary action, one fallback action, and one avoid-for-now item.
3. The recommendation is explicitly scoped as a Contact Lens output: it may rank, explain, prepare, and propose, but it cannot decide or execute external actions for the human.
4. The recommendation shows an inspectable score chain covering authority, risk, objective alignment, bottleneck relief, leverage, time fit, energy fit, deadline pressure, flow cost, morning brief relevance, evidence confidence, and feedback history.
5. The user can set the current time window and energy state, then give feedback when the recommendation is useful, wrong priority, or blocked.

This is intentionally not a claim that the full canonical schema is complete. The current implementation reuses existing local-first tasks, daily commitments, canonical commitments, workflow run artifacts, approvals, reviews, and suggestion feedback. Dedicated relational tables for Objective, KeyResult, StrategicBet, Decision, Opportunity, Delegation, AuthorityBoundary, FocusBlock, ImplementationIntention, and MorningBrief should be added in later slices as the data model hardens.

## Deployment Topology

Pillar Time supports two explicit operating modes.

### Personal Desktop Mode

- One user.
- Local SQLite source of truth.
- Desktop scheduling and reminders.
- Local planning and private records.
- Direct user-authorized connectors where technically possible.
- No claim of multi-user collaboration.

### Executive Workspace Mode

- One executive with one or more authorized assistants or delegates.
- Secure coordination service for shared records, webhooks, approvals, policies, audit records, and connector execution.
- Durable relational database for shared state.
- Durable event queue.
- Authenticated desktop or web clients.
- Strict workspace and user isolation.
- Local caching only for records the signed-in user is authorized to see.

Do not simulate collaboration by sharing a SQLite file or trusting a client-side role flag. Keep desktop mode usable without the collaboration service, and clearly distinguish features that require workspace mode.

## Workspace Identity And Delegation

Support capability-based permissions, not only role names. Required roles include executive, primary assistant, delegated or backup assistant, workspace administrator, and read-only reviewer.

Permission capabilities include:

- View professional calendar details.
- View personal event details.
- View busy-only private blocks.
- Create scheduling proposals.
- Create tentative internal holds.
- Edit executive preferences.
- Draft external communications.
- Request approvals.
- Approve specific action classes.
- Execute approved actions.
- View sensitive travel data.
- View financial amounts.
- Manage connectors.
- Export or delete data.

Delegations must include scope, effective date, expiration date, approval threshold, permitted systems, permitted partitions, revocation, and full audit history.

The assistant interface must not be a copy of the executive interface. Executive view prioritizes approvals, decisions, Highest Leverage Today, Today’s Three, calendar pressure, commitments, relationship prep, and reviews. Assistant view prioritizes request queues, assigned work, prep requirements, scheduling proposals, missing information, pending approvals, waiting-on items, upcoming dates, travel risks, comments, mentions, assignments, watchers, status, and activity history.

## Canonical Executive Data Model

Use a provider-independent canonical model. Principal entities include:

- Workspace
- User
- Role and permission
- Executive profile
- Person
- Organization
- Relationship
- Commitment
- Project or goal
- Calendar event
- Message thread
- Meeting
- Document
- Important date
- Trip
- Reservation
- Reminder
- Review
- Policy
- Approval request
- Proposed action
- Executed action
- Connector account
- External reference
- Audit event

Every canonical record must support stable internal ID, workspace ownership, professional or personal partition, creator, source provenance, timestamps, external references, sync status, visibility permissions, and audit history.

## Commitment Is The Central Object

`Commitment` is the central operational object. It can originate from email, chat, meeting transcript, notes, calendar, task platform, document, verbal/manual entry, or AI extraction.

Commitments should support title, description, owner, requested by, due date, priority, leverage category, source, related person, organization, project, next action, estimate, status, waiting-on, blockers, related event, reminders, partition, confidence, verification state, authoritative system, external IDs, and history.

Use a clear state model:

- proposed
- confirmed
- scheduled
- in progress
- waiting
- blocked
- delegated
- completed
- canceled

AI-extracted commitments begin as proposed unless an explicitly approved policy permits automatic internal creation. Preserve the exact evidence that produced the proposal: connector, external object ID, sender or speaker, timestamp, source excerpt/location, extraction confidence, model, and prompt version. Do not overwrite source evidence when a commitment is edited.

### Deduplication And System Of Record

Implement candidate matching, merge proposals, source linking, duplicate detection, manual merge/split, and audit history. Do not silently merge uncertain records.

Allow one authoritative system per object category. Other systems can contribute observations and linked records, but must not simultaneously act as competing authorities. Prevent sync loops with origin connector, internal and external IDs, external version or ETag, last synced version, idempotency keys, change fingerprints, and write provenance.

## Relationship Directory

Build a canonical relationship directory instead of a flat contacts list. Person records should support aliases, organization, title, professional/personal classification, relationship tier/type, emails, phones, assistants or gatekeepers, birthdays, anniversaries, last interaction, open commitments, important notes, communication preferences, verified fields, inferred fields, provenance, and visibility permissions.

Resolve identities across Google, Microsoft, Slack, Teams, CRM, meeting, and task sources. AI-inferred fields remain proposed changes until approved. Support manual merge/split. Sensitive personal notes must not be exposed to assistants unless explicitly authorized.

## Connector Platform

Implement provider interfaces instead of embedding provider-specific assumptions in product logic. Provider interfaces include calendar, mail, contacts, chat, meeting, task, knowledge, file, CRM, directory, travel, expense, notification, and text-to-speech.

Every production connector should support authentication, least-privileged scopes, token refresh/revocation, health, initial sync, incremental sync, webhook/change notifications where available, polling fallback, pagination, rate limiting, retries, idempotency, canonical normalization, external mutations, result verification, disconnection, export/deletion behavior, test doubles, and setup documentation.

Do not display a connector as available merely because an interface or logo exists. A connector counts as implemented only when auth, sync, health, disconnection, error handling, and promised read/write operations work. Verify current provider capabilities, scopes, webhooks, quotas, review requirements, and restrictions from official docs before implementing.

### First-Release Connector Stack

Prioritize:

- Google Workspace identity
- Google Calendar
- Gmail
- Google Contacts
- Google Drive and Docs
- Google Meet metadata
- Slack
- Linear as the initial task-system integration
- Desktop notifications
- Telegram delivery
- Email delivery or drafts

Architect Microsoft 365 behind the same provider interfaces, but do not claim Microsoft support until functional. Treat Zoom, purchases, travel rebooking, gifts, reservations, CRM, HRIS, expenses, SMS, and native mobile push as later capabilities unless they can be completed without compromising the core loop.

## Intelligence Features

### Email And Messaging

Support VIP and urgency classification, executive-action-required detection, commitment/date/follow-up extraction, attachment and document discovery, suggested delegation, agenda-topic creation, reminder suggestions, unanswered-message review, and response drafting in the executive’s configured style.

All external messages remain drafts at initial release. Sending email, Slack, Teams, or other communications requires approval unless a narrow visible policy permits the exact class of communication.

### Meetings

Before substantive meetings, generate preparation packets with objective, desired outcome, agenda, attendee profiles, relationship context, open commitments, previous decisions, relevant messages/documents, source-supported sensitive topics, joining instructions, location, travel time, required prep, and expected decisions.

Every factual item must link to its source or state that it is an inference. Do not invent attendee history or relationship context.

After meetings, propose a summary, decision log, commitments, owners, due dates, related people/projects, follow-up communication, running agenda updates, reminders, and ambiguity flags. Meeting-derived actions remain proposals until approved according to policy. Recording and transcription must respect platform permissions, participant consent, workspace policy, and applicable law.

### Travel And Life Logistics

Add trip and itinerary models later, prioritizing booking-confirmation ingestion and trip management rather than ticket purchasing. Do not issue tickets, make purchases, cancel reservations, or rebook travel in the initial release. Future purchasing or rebooking requires strong confirmation and narrowly bounded policy. Do not store raw payment-card data.

Represent health-related items as private appointments or reminders. Do not add medical-record integration or store diagnoses/treatment details in the initial release.

## Automation Pipeline

All automations use the same pipeline:

Trigger -> normalize event -> retrieve authorized context -> evaluate policies -> generate proposed action -> determine approval requirement -> request approval when required -> execute through typed connector action -> verify external result -> audit.

Do not permit a language model to bypass this pipeline.

Normalize webhook events, polling results, manual actions, schedules, and internal changes into a common event envelope containing event ID, workspace, provider, connector account, event type, external object ID, occurred-at, received-at, actor, partition, dedupe key, raw-payload retention reference, and processing status.

Desktop mode may use a SQLite-backed durable queue. Workspace mode requires a server-side durable queue with retries, dead letters, replay tools, idempotent consumers, webhook signature verification, replay protection, event ordering, reconciliation jobs, connector lag visibility, and manual retry.

## Policy And Approval

Policies are visible, editable, versioned data with name, description, owner, scope, trigger, conditions, permitted actions, affected connectors, data partitions, risk level, approval requirement, financial threshold, recipient restrictions, frequency limits, effective/expiration dates, enabled state, version, change history, examples, last execution, and execution count.

Support simulation and dry-run mode. Proposed policies must never be silently enabled. “Always handle this way” opens a policy editor, shows inferred trigger and constraints, requires scope confirmation, creates a visible versioned policy, allows immediate disable/delete, and records the creating approval.

Classify actions as:

- Automatic analysis: summaries, classification, conflict detection, scoring, recommendations, drafts, reminder generation. No external mutation.
- Automatic but reversible: internal labels, private notes, checklists, internal tentative holds, only where reliable undo exists.
- Approval required: sending messages, changing external calendar events, declining meetings, sharing documents, creating externally visible tasks, confirming reservations, submitting expenses.
- Strong confirmation: purchases, flight changes, cancellations, sensitive disclosures, executive-signed external communication, financial or reputational consequences.
- Manual only: legal commitments, medical decisions, employment decisions, bank transfers, unusual/high-value transactions, actions prohibited by policy.

Approval cards must show trigger, sources, exact action, current and proposed values, before/after preview, rationale, confidence, missing information, policy and version, notified people/systems, disclosed data, financial impact, reputational or scheduling consequences, reversibility, expiration, and Approve/Modify/Reject/Create Policy actions.

Stale approvals must not execute. High-risk approvals must not support indiscriminate bulk approval. Notification approvals must use authenticated expiring controls, not unauthenticated free-text replies.

## Action Execution And Verification

Every external mutation must use a typed action executor and produce an execution record with approval reference, policy version, connector, typed operation, sanitized request summary, idempotency key, timing, external result ID, verification result, retry history, error state, and undo/compensating status.

After execution, read the affected external object where possible and verify intended change. Do not mark success only because an API request returned without a transport error.

## Privacy, AI, And Audit Boundaries

Separate professional and personal data at the model level, not only as a visual filter. Support per-field visibility, record overrides, AI-processing permission, export restrictions, and sensitive access audit.

Busy-only private events expose only start, end, busy status, and optional travel constraint. Do not expose title, description, attendees, location, attachments, conference link, or notes, and do not send redacted private-event details to AI providers.

Store passport numbers/images, visa details, known-traveler numbers, loyalty credentials, sensitive travel documents, and designated secrets in a dedicated encrypted vault. Use OS secure storage in desktop mode and managed key storage in workspace mode. Do not store payment-card numbers.

AI may extract, match, summarize, rank, draft, and propose policies. AI must not execute connector actions. All AI output passes through structured schemas, validation, authorization, policy evaluation, approval determination, typed execution, verification, and audit. Treat connector content as untrusted and protect against prompt injection.

Maintain append-only, tamper-evident audit history for consequential events. Do not log complete message bodies, raw tokens, passport numbers, payment details, or unnecessary private-event data.

## Native Planning Automations

Treat these as native scheduled capabilities, not user-built workflow templates:

- Morning briefing
- Midday delta
- End-of-day wrap
- Weekly kickoff
- Midweek checkpoint
- Friday recap
- Monthly four-to-six-week horizon scan
- Quarterly 90-day review
- Annual big-rock planning

Midday delta reports only meaningful changes since morning. Every generated briefing distinguishes verified facts, extracted commitments, agent suggestions, user-confirmed commitments, pending approvals, and missing information.

## First Production-Quality Loop

The first production-quality release should prove this loop:

1. Receive data from selected calendar, email, contacts, chat, task, meeting, and document systems.
2. Normalize people, meetings, and commitments.
3. Detect calendar and commitment risks.
4. Generate morning and end-of-day briefings.
5. Prepare substantive meetings.
6. Draft post-meeting commitments and follow-up.
7. Triage inbox items and draft responses.
8. Route material actions to a central approval queue.
9. Execute approved actions idempotently.
10. Verify and audit the result.

Defer non-core commerce, travel purchasing/rebooking, gifts, restaurant reservations, CRM/HRIS sync, expenses, broad SMS, multiple competing task systems, and autonomous external communication until the core loop is reliable.

## Required Test Themes

Add automated and manual acceptance coverage for role separation, permission expiration, partition isolation, busy-only redaction, sensitive-field controls, workspace isolation, commitment extraction from multiple sources, duplicate handling, contact verification and merge/split, system-of-record enforcement, sync-loop prevention, webhook security and replay prevention, event dedupe, reconciliation, dead letters, stale approval invalidation, policy versioning, editable policy creation, disabled policy blocking, typed action validation, result verification, undo/compensation, private-data AI exclusion, prompt-injection resistance, credential redaction, connector revocation, export/deletion, append-only audit, offline sync, conflicting updates, authenticated approval links, expired links, and external messages never sending without required approval.
