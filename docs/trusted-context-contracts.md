# Trusted Context Contracts

This document defines the shared contracts for the Trusted Personal Context subsystem. It is the source of truth for Agent B through Agent H when adding persistence, retrieval, privacy enforcement, UI, workflow integration, tests, and operational docs.

The contracts are language-neutral but use TypeScript-style notation for precision. Storage implementations may use SQLite tables, JSON columns, or generated validators as long as they preserve these semantics.

## Contract Rules

- Stable context explains how to interpret live data. Live data establishes what is true now.
- Every consequential model request must use a `ContextEnvelope`.
- Every envelope must declare interaction mode, actor, subject, audience, channel, workspace, partition, task, risk, external visibility, action type, and temporal frame.
- Context assembly must run after authorization and before AI execution.
- AI output may propose records, actions, memories, and policies. It may not directly mutate connectors, confirmed facts, policies, vault secrets, or audit history.
- Facts are field-level where provenance, disclosure, validity, or conflicts differ.
- Source evidence is append-only. Editing a fact creates a new version or superseding fact; it does not rewrite the evidence that produced the earlier claim.

## Shared Enums

```ts
export type ContextLayer =
  | "platform_constitution"
  | "workspace_constitution"
  | "identity_role_kernel"
  | "canonical_profile"
  | "live_operating_state"
  | "episodic_memory"
  | "learned_profile";

export type InteractionMode =
  | "speaking_to_subject"
  | "speaking_for_subject"
  | "speaking_about_subject"
  | "internal_administrative_action";

export type Partition = "professional" | "personal" | "mixed" | "system";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ExternalVisibility =
  | "none"
  | "internal_only"
  | "workspace_visible"
  | "specific_external_audience"
  | "public";

export type RequestedActionType =
  | "analysis"
  | "recommendation"
  | "draft"
  | "internal_note"
  | "internal_hold"
  | "profile_update"
  | "policy_update"
  | "external_message"
  | "external_calendar_mutation"
  | "external_task_mutation"
  | "document_share"
  | "travel_or_reservation_change"
  | "purchase_or_financial_action"
  | "export"
  | "delete";

export type ApprovalClass =
  | "automatic_analysis"
  | "automatic_reversible"
  | "approval_required"
  | "strong_confirmation"
  | "manual_only";

export type FactStatus =
  | "proposed"
  | "active"
  | "disputed"
  | "superseded"
  | "rejected"
  | "expired"
  | "deleted";

export type VerificationStatus =
  | "unverified"
  | "imported_unverified"
  | "observed"
  | "inferred"
  | "user_confirmed"
  | "source_verified"
  | "policy_approved"
  | "system_verified";

export type ReliabilityTier =
  | "platform_rule"
  | "policy"
  | "current_user_instruction"
  | "approved_override"
  | "authoritative_live"
  | "verified_profile"
  | "confirmed_history"
  | "approved_pattern"
  | "imported_unverified"
  | "observation"
  | "inference"
  | "default";

export type Freshness =
  | "live"
  | "fresh"
  | "recent"
  | "stale"
  | "expired"
  | "unknown";

export type SyncState =
  | "not_configured"
  | "healthy"
  | "syncing"
  | "lagging"
  | "failed"
  | "revoked"
  | "rate_limited";

export type VisibilityScope =
  | "subject_private"
  | "authorized_assistants"
  | "workspace"
  | "named_audience"
  | "external_allowed"
  | "public";

export type AiProcessingPermission =
  | "allowed"
  | "allowed_redacted"
  | "local_only"
  | "denied";

export type ConflictPolicy =
  | "authoritative_source_wins"
  | "newest_authoritative_wins"
  | "highest_reliability_wins"
  | "manual_review_required"
  | "keep_parallel_claims";

export type MemoryKind =
  | "episode"
  | "observation"
  | "inference"
  | "approved_pattern"
  | "profile_update_proposal"
  | "policy_update_proposal";
```

## Identity Types

```ts
export interface ActorRef {
  userId: string;
  personId?: string;
  workspaceId: string;
  roles: string[];
  capabilities: Capability[];
  authenticatedAt: string;
  delegationId?: string;
}

export interface SubjectRef {
  personId: string;
  workspaceId: string;
}

export interface AudienceRef {
  kind: "self" | "assistant" | "workspace_role" | "named_person" | "organization" | "external_group" | "public";
  ids: string[];
  description?: string;
}

export type Capability =
  | "view_professional_calendar_details"
  | "view_personal_event_details"
  | "view_busy_only_private_blocks"
  | "create_scheduling_proposals"
  | "create_tentative_internal_holds"
  | "edit_executive_preferences"
  | "draft_external_communications"
  | "request_approvals"
  | "approve_action_class"
  | "execute_approved_actions"
  | "view_sensitive_travel_data"
  | "view_financial_amounts"
  | "manage_connectors"
  | "export_data"
  | "delete_data"
  | "manage_context_constitution"
  | "manage_source_authority"
  | "review_memory_proposals";
```

## Canonical Resource Model

```ts
export interface CanonicalResource<TPayload = unknown> {
  id: string;
  workspaceId: string;
  subjectId: string;
  resourceType: ResourceType;
  partition: Partition;
  status: FactStatus;
  payload: TPayload;
  provenance: ProvenanceRef[];
  validity: BitemporalValidity;
  visibility: VisibilityPolicy;
  aiProcessing: AiProcessingPermission;
  confidence: number;
  verificationStatus: VerificationStatus;
  reliabilityTier: ReliabilityTier;
  supersedesResourceIds: string[];
  supersededByResourceId?: string;
  externalRefs: ExternalRef[];
  auditRefs: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | "context_constitution"
  | "identity_role"
  | "source_authority"
  | "privacy_disclosure"
  | "authority_approval"
  | "time_scheduling_policy"
  | "communication_style"
  | "priority_goal"
  | "person_relationship"
  | "organization_project"
  | "life_travel_profile"
  | "important_date_ritual"
  | "decision_position"
  | "meeting_playbook"
  | "approved_example"
  | "profile_fact"
  | "live_snapshot"
  | "episodic_memory"
  | "learned_pattern"
  | "memory_proposal";

export interface BitemporalValidity {
  validFrom?: string;
  validTo?: string;
  transactionFrom: string;
  transactionTo?: string;
  learnedAt: string;
  assertedAt?: string;
  timezone?: string;
}

export interface ExternalRef {
  provider: string;
  connectorAccountId?: string;
  externalObjectId: string;
  externalVersion?: string;
  url?: string;
  lastSyncedAt?: string;
}
```

## Profile Fact Schema

```ts
export interface ProfileFact<TValue = unknown> {
  id: string;
  workspaceId: string;
  subjectId: string;
  resourceType: ResourceType;
  fieldPath: string;
  value: TValue;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "datetime"
    | "timezone"
    | "enum"
    | "object"
    | "list"
    | "vault_reference";
  partition: Partition;
  status: FactStatus;
  verificationStatus: VerificationStatus;
  reliabilityTier: ReliabilityTier;
  confidence: number;
  validity: BitemporalValidity;
  provenance: ProvenanceRef[];
  visibility: VisibilityPolicy;
  aiProcessing: AiProcessingPermission;
  disclosure: DisclosurePolicy;
  sourceAuthorityRuleId?: string;
  supersedesFactIds: string[];
  supersededByFactId?: string;
  conflictSetId?: string;
  retention: RetentionPolicy;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProvenanceRef {
  id: string;
  sourceKind:
    | "user_entry"
    | "assistant_entry"
    | "connector"
    | "document"
    | "message"
    | "calendar_event"
    | "meeting_transcript"
    | "task"
    | "import"
    | "model_extraction"
    | "policy"
    | "system";
  sourceId: string;
  connectorAccountId?: string;
  externalObjectId?: string;
  sourceTimestamp?: string;
  capturedAt: string;
  evidenceLocator?: string;
  excerptHash?: string;
  sanitizedExcerpt?: string;
  extractionModel?: string;
  promptVersion?: string;
  confidence?: number;
}

export interface VisibilityPolicy {
  scopes: VisibilityScope[];
  namedAudienceIds: string[];
  fieldRedactions: string[];
  busyOnly: boolean;
  exportAllowed: boolean;
  deleteAllowed: boolean;
}

export interface DisclosurePolicy {
  allowedModes: InteractionMode[];
  allowedChannels: string[];
  externalDisclosure: ExternalVisibility;
  requiresApproval: boolean;
  prohibitedAudiences: string[];
  disclosureNotes?: string;
}

export interface RetentionPolicy {
  retainUntil?: string;
  retentionStatus: "active" | "expires" | "legal_hold" | "delete_requested" | "deleted";
  deleteAfterSupersededDays?: number;
}
```

## Source Authority Rules

```ts
export interface SourceAuthorityRule {
  id: string;
  workspaceId: string;
  subjectId: string;
  resourceType: ResourceType;
  fieldPath: string;
  partition: Partition | "any";
  primaryAuthority: AuthoritySource;
  fallbackAuthorities: AuthoritySource[];
  conflictPolicy: ConflictPolicy;
  permittedWriters: string[];
  approvalRequiredForChange: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthoritySource {
  kind: "platform" | "policy" | "user_instruction" | "connector" | "canonical_profile" | "memory" | "default";
  id: string;
  reliabilityTier: ReliabilityTier;
}
```

## Context Envelope Contract

```ts
export interface ContextEnvelope {
  envelopeId: string;
  schemaVersion: "trusted-context-envelope.v1";
  workspaceId: string;
  mode: InteractionMode;
  actor: ActorRef;
  subject: SubjectRef;
  audience: AudienceRef;
  channel: string;
  partition: Partition;
  task: ContextTask;
  riskLevel: RiskLevel;
  externalVisibility: ExternalVisibility;
  requestedActionType: RequestedActionType;
  approvalClass: ApprovalClass;
  temporalFrame: TemporalFrame;
  constitution: ConstitutionSlice;
  identityKernel: IdentityRoleKernel;
  canonicalFacts: ProfileFact[];
  liveSnapshots: LiveSnapshot[];
  episodicMemories: EpisodicMemory[];
  learnedSignals: LearnedSignal[];
  citations: ContextCitation[];
  redactions: ContextRedaction[];
  conflicts: ContextConflict[];
  quality: ContextQuality;
  constraints: ContextConstraint[];
  audit: ContextAssemblyAudit;
}

export interface ContextTask {
  kind:
    | "daily_briefing"
    | "today_ranking"
    | "reminder_generation"
    | "calendar_suggestion"
    | "meeting_prep"
    | "commitment_extraction"
    | "relationship_intelligence"
    | "communication_draft"
    | "approval_card"
    | "travel_logistics"
    | "important_date_workflow"
    | "profile_management"
    | "context_health"
    | "other";
  description: string;
  relatedResourceIds: string[];
  requiredFields: string[];
}

export interface TemporalFrame {
  now: string;
  currentDate: string;
  currentTime: string;
  primaryTimezone: string;
  eventTimezone?: string;
  destinationTimezone?: string;
  currentLocationRef?: string;
  horizonStart?: string;
  horizonEnd?: string;
  lastConnectorSyncAt?: string;
  requiredSystemsSynchronized: boolean;
  staleSources: StaleSource[];
  unresolvedTemporalConflicts: string[];
}

export interface ConstitutionSlice {
  platformVersion: string;
  workspaceConstitutionId: string;
  workspaceVersion: number;
  applicablePolicyIds: string[];
  immutableRulesSummary: string[];
  workspaceRulesSummary: string[];
}

export interface IdentityRoleKernel {
  personId: string;
  preferredName?: string;
  formalName?: string;
  pronouns?: string;
  namePronunciation?: string;
  currentTitle?: string;
  organization?: string;
  primaryResponsibilities: string[];
  primaryTimezone: string;
  usualLocations: string[];
  preferredLanguage?: string;
  accessibilityRequirements: string[];
  activeRoles: RoleAssignment[];
  historicalRoles: RoleAssignment[];
  sourceRefs: string[];
  verificationStatus: VerificationStatus;
}

export interface RoleAssignment {
  roleId: string;
  roleName: string;
  organizationId?: string;
  title?: string;
  responsibilities: string[];
  effectiveFrom: string;
  effectiveTo?: string;
  sourceRefs: string[];
  verificationStatus: VerificationStatus;
}
```

## Live Snapshot Contract

```ts
export interface LiveSnapshot<TPayload = unknown> {
  id: string;
  workspaceId: string;
  subjectId: string;
  source: string;
  connectorAccountId?: string;
  snapshotType:
    | "calendar"
    | "commitments"
    | "tasks"
    | "messages"
    | "reservations"
    | "project_state"
    | "location"
    | "travel_disruption"
    | "sync_status";
  payload: TPayload;
  retrievedAt: string;
  sourceDataTimestamp?: string;
  freshness: Freshness;
  syncState: SyncState;
  unresolvedErrors: string[];
  accessScope: string[];
  partition: Partition;
  provenance: ProvenanceRef[];
}

export interface StaleSource {
  source: string;
  connectorAccountId?: string;
  lastSuccessfulSyncAt?: string;
  freshness: Freshness;
  impact: "none" | "context_quality" | "approval_blocking" | "execution_blocking";
  message: string;
}
```

## Memory Contracts

```ts
export interface EpisodicMemory {
  id: string;
  workspaceId: string;
  subjectId: string;
  kind: Extract<MemoryKind, "episode">;
  title: string;
  participants: string[];
  occurredAt: string;
  context: string;
  result: string;
  sensitivity: RiskLevel;
  relevanceTags: string[];
  retention: RetentionPolicy;
  verificationStatus: VerificationStatus;
  provenance: ProvenanceRef[];
  visibility: VisibilityPolicy;
}

export interface LearnedSignal {
  id: string;
  workspaceId: string;
  subjectId: string;
  kind: Exclude<MemoryKind, "episode">;
  claim: string;
  proposedFact?: Partial<ProfileFact>;
  proposedPolicyId?: string;
  evidenceRefs: ProvenanceRef[];
  status: "active" | "proposed" | "approved" | "rejected" | "expired";
  confidence: number;
  expiresAt?: string;
}
```

## Conflict And Quality Contracts

```ts
export interface ContextConflict {
  id: string;
  fieldPath: string;
  resourceIds: string[];
  factIds: string[];
  conflictPolicy: ConflictPolicy;
  selectedFactId?: string;
  requiresManualReview: boolean;
  explanation: string;
}

export interface ContextQuality {
  completeness: "complete" | "partial" | "insufficient";
  confidence: number;
  missingRequiredFields: string[];
  staleRequiredSources: StaleSource[];
  redactionCount: number;
  conflictCount: number;
  approvalBlockers: string[];
  safeToUseForRequestedAction: boolean;
}

export interface ContextConstraint {
  kind:
    | "approval_required"
    | "strong_confirmation_required"
    | "manual_only"
    | "disclosure_blocked"
    | "ai_processing_blocked"
    | "stale_data_blocks_action"
    | "vault_access_required"
    | "permission_missing";
  message: string;
  relatedIds: string[];
}
```

## Citation And Redaction Contracts

```ts
export interface ContextCitation {
  id: string;
  factId?: string;
  snapshotId?: string;
  memoryId?: string;
  provenanceId: string;
  label: string;
  locator?: string;
  sourceTimestamp?: string;
  reliabilityTier: ReliabilityTier;
}

export interface ContextRedaction {
  id: string;
  fieldPath: string;
  reason:
    | "permission_denied"
    | "partition_blocked"
    | "audience_blocked"
    | "ai_processing_denied"
    | "busy_only_private_event"
    | "vault_secret"
    | "external_disclosure_blocked"
    | "not_relevant";
  replacement: "omitted" | "busy_only" | "vault_reference" | "summary";
}
```

## Service Interfaces

Product code should depend on these interfaces rather than storage internals.

```ts
export interface TrustedContextService {
  assembleEnvelope(request: ContextRequest): Promise<ContextEnvelope>;
  explainEnvelope(envelopeId: string): Promise<ContextAssemblyAudit>;
  validateEnvelope(envelope: ContextEnvelope): ValidationResult;
}

export interface ProfileFactService {
  proposeFact(input: ProposeFactInput): Promise<ProfileFact>;
  confirmFact(factId: string, actor: ActorRef, note?: string): Promise<ProfileFact>;
  rejectFact(factId: string, actor: ActorRef, reason: string): Promise<ProfileFact>;
  supersedeFact(factId: string, replacement: ProposeFactInput): Promise<ProfileFact>;
  getFacts(query: FactQuery): Promise<ProfileFact[]>;
}

export interface SourceAuthorityService {
  getApplicableRules(query: AuthorityQuery): Promise<SourceAuthorityRule[]>;
  resolveFieldConflict(input: ResolveConflictInput): Promise<ContextConflict>;
  upsertRule(input: SourceAuthorityRule, actor: ActorRef): Promise<SourceAuthorityRule>;
}

export interface ContextPermissionService {
  canReadFact(actor: ActorRef, fact: ProfileFact, request: ContextRequest): Promise<boolean>;
  canDiscloseFact(actor: ActorRef, fact: ProfileFact, audience: AudienceRef, channel: string): Promise<boolean>;
  canProcessWithAi(actor: ActorRef, fact: ProfileFact, request: ContextRequest): Promise<AiProcessingPermission>;
  canUseVaultReference(actor: ActorRef, vaultRef: string, request: ContextRequest): Promise<boolean>;
}

export interface LiveContextService {
  getSnapshots(request: LiveSnapshotRequest): Promise<LiveSnapshot[]>;
  classifyFreshness(snapshot: LiveSnapshot, requiredAsOf: string): Freshness;
}

export interface ContextMemoryService {
  retrieveEpisodes(request: MemoryRetrievalRequest): Promise<EpisodicMemory[]>;
  recordObservation(input: LearnedSignal): Promise<LearnedSignal>;
  proposeProfileUpdate(input: LearnedSignal): Promise<LearnedSignal>;
  expireSignal(signalId: string, reason: string): Promise<LearnedSignal>;
}
```

### Supporting Service Types

```ts
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
  severity: "warning" | "error" | "blocking";
}

export interface ContextAssemblyAudit {
  envelopeId: string;
  requestedAt: string;
  assembledAt: string;
  actorId: string;
  subjectId: string;
  resourceQuerySummary: Record<string, unknown>;
  includedIds: string[];
  excludedIds: string[];
  redactionIds: string[];
  conflictIds: string[];
  constraintKinds: string[];
  eventIds: string[];
}

export interface ProposeFactInput<TValue = unknown> {
  workspaceId: string;
  subjectId: string;
  resourceType: ResourceType;
  fieldPath: string;
  value: TValue;
  valueType: ProfileFact["valueType"];
  partition: Partition;
  provenance: ProvenanceRef[];
  visibility: VisibilityPolicy;
  aiProcessing: AiProcessingPermission;
  disclosure: DisclosurePolicy;
  validity: Partial<BitemporalValidity>;
  confidence: number;
  verificationStatus: VerificationStatus;
  actor: ActorRef;
}

export interface FactQuery {
  workspaceId: string;
  subjectId: string;
  resourceTypes?: ResourceType[];
  fieldPaths?: string[];
  partition?: Partition;
  asOfValidTime?: string;
  asOfTransactionTime?: string;
  statuses?: FactStatus[];
  includeSuperseded?: boolean;
}

export interface AuthorityQuery {
  workspaceId: string;
  subjectId: string;
  resourceType: ResourceType;
  fieldPath?: string;
  partition?: Partition;
  asOf?: string;
}

export interface ResolveConflictInput {
  workspaceId: string;
  subjectId: string;
  fieldPath: string;
  candidateFacts: ProfileFact[];
  rules: SourceAuthorityRule[];
  request?: ContextRequest;
}

export interface LiveSnapshotRequest {
  workspaceId: string;
  subjectId: string;
  snapshotTypes: LiveSnapshot["snapshotType"][];
  partition: Partition;
  temporalFrame: TemporalFrame;
  requiredFreshness?: Freshness;
  actor: ActorRef;
}

export interface MemoryRetrievalRequest {
  workspaceId: string;
  subjectId: string;
  task: ContextTask;
  partition: Partition;
  temporalFrame: TemporalFrame;
  relevanceTags: string[];
  limit: number;
  actor: ActorRef;
}
```

## Context Request

```ts
export interface ContextRequest {
  workspaceId: string;
  mode: InteractionMode;
  actor: ActorRef;
  subject: SubjectRef;
  audience: AudienceRef;
  channel: string;
  partition: Partition;
  task: ContextTask;
  riskLevel: RiskLevel;
  externalVisibility: ExternalVisibility;
  requestedActionType: RequestedActionType;
  temporalFrame: TemporalFrame;
  requiredResourceTypes: ResourceType[];
  requiredFieldPaths: string[];
  maxFacts?: number;
  maxMemories?: number;
}
```

## Event Names

Trusted Context events use the `trusted_context.` prefix and are mapped into the append-only audit log.

```ts
export type TrustedContextEventName =
  | "trusted_context.constitution.version_created"
  | "trusted_context.source_authority.rule_created"
  | "trusted_context.source_authority.rule_updated"
  | "trusted_context.profile_fact.proposed"
  | "trusted_context.profile_fact.confirmed"
  | "trusted_context.profile_fact.rejected"
  | "trusted_context.profile_fact.superseded"
  | "trusted_context.profile_fact.expired"
  | "trusted_context.profile_fact.conflict_detected"
  | "trusted_context.profile_fact.conflict_resolved"
  | "trusted_context.live_snapshot.captured"
  | "trusted_context.live_snapshot.stale"
  | "trusted_context.memory.episode_recorded"
  | "trusted_context.memory.observation_recorded"
  | "trusted_context.memory.inference_proposed"
  | "trusted_context.memory.proposal_approved"
  | "trusted_context.memory.proposal_rejected"
  | "trusted_context.envelope.requested"
  | "trusted_context.envelope.assembled"
  | "trusted_context.envelope.redacted"
  | "trusted_context.envelope.blocked"
  | "trusted_context.permission.denied"
  | "trusted_context.vault_reference.used"
  | "trusted_context.export.requested"
  | "trusted_context.delete.requested";
```

```ts
export interface TrustedContextEvent {
  id: string;
  name: TrustedContextEventName;
  workspaceId: string;
  actorId: string;
  subjectId?: string;
  occurredAt: string;
  idempotencyKey: string;
  correlationId?: string;
  causationId?: string;
  partition: Partition;
  riskLevel: RiskLevel;
  payload: Record<string, unknown>;
  auditRedactions: string[];
}
```

## Permission Matrix

| Mode | Private context use | External disclosure | AI processing | Approval posture |
| --- | --- | --- | --- | --- |
| `speaking_to_subject` | Allowed when actor is subject or authorized delegate | None unless requested separately | Allowed only per fact policy | Usually analysis; escalate for mutations |
| `speaking_for_subject` | Limited to necessary verified facts | Audience and channel specific | No denied/private-only facts | Approval required when externally visible |
| `speaking_about_subject` | Blocked unless permitted for audience | Only allowed scopes | Redact audience-blocked fields | Approval required for sensitive disclosure |
| `internal_administrative_action` | Minimum necessary only | None by default | Prefer local/redacted context | Depends on requested action |

## Approval Semantics

Map requested actions to approval classes:

| Requested action | Default approval class |
| --- | --- |
| `analysis`, `recommendation`, `draft` | `automatic_analysis` |
| `internal_note`, `internal_hold` | `automatic_reversible` |
| `profile_update`, `policy_update`, `external_message`, `external_calendar_mutation`, `external_task_mutation`, `document_share`, `export`, `delete` | `approval_required` |
| `travel_or_reservation_change`, `purchase_or_financial_action` | `strong_confirmation` |

Platform policy may raise but not lower the required approval class. Manual-only policy always wins.

## Module Ownership Boundaries

Agent A owns this document and [trusted-context-architecture.md](trusted-context-architecture.md).

Agent B may implement persistence, migrations, history, snapshots, and audit tables, but must preserve the contracts above.

Agent C may implement envelope assembly, retrieval, relevance, reconciliation, stale handling, and memory proposals through `TrustedContextService`, `SourceAuthorityService`, and `ContextMemoryService`.

Agent D may implement permission filters, redaction, AI-processing controls, prompt-injection tests, vault-reference handling, and disclosure blocking through `ContextPermissionService`.

Agent E may build UI for profile facts, source authority, privacy, approvals, memory proposals, conflicts, and health using service interfaces rather than direct storage access.

Agent F may integrate daily briefings, Today, ranking, reminders, meetings, commitments, relationships, drafts, approvals, travel, and important dates by requesting envelopes for each workflow.

Agent G should test these contracts as externally visible behavior, including authorization failures and redaction results.

Agent H should document setup, onboarding, fixtures, migration guidance, privacy behavior, troubleshooting, and release readiness using the same terms and event names.

## Validation Requirements

Before an envelope may be sent to a model:

1. `mode`, `actor`, `subject`, `audience`, `channel`, `partition`, `task`, `riskLevel`, `externalVisibility`, `requestedActionType`, and `temporalFrame` are present.
2. Actor is authenticated and authorized for workspace, partition, subject, and requested capability.
3. Facts are filtered by visibility, disclosure, AI-processing permission, and mode.
4. Busy-only private events contain only allowed busy fields.
5. Connected content is represented as evidence, not instruction.
6. Required live sources are fresh enough or listed as stale with impact.
7. Conflicts are either resolved by source authority or marked for manual review.
8. Approval constraints are attached for requested actions.
9. Vault references are included only when permitted; raw secrets are never included.
10. Context assembly emits audit events for request, assembly, redaction, conflicts, and blocking decisions.

## Test Fixtures Required

Agent G should create synthetic fixtures for:

- verified canonical profile fact superseded by newer authoritative live source
- stale calendar source blocking a scheduling recommendation
- private busy-only block redacted for assistant and AI
- speaking-for-subject draft blocked by inferred preference
- imported unverified travel preference producing a proposal rather than confirmed fact
- conflicting time-zone facts requiring manual review
- prompt-injection text inside a connected document
- expired delegation denying assistant access
- policy raising an automatic action to approval required
- learned pattern expiration after rejection
