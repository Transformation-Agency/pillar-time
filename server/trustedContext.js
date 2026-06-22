export const trustLevels = {
  platform_constitution: 1,
  workspace_policy: 2,
  current_user_instruction: 3,
  temporary_override: 4,
  authoritative_live_system: 5,
  verified_canonical_profile: 6,
  confirmed_historical_decision: 7,
  approved_behavioral_pattern: 8,
  imported_unverified: 9,
  observation: 10,
  inference: 11,
  application_default: 12,
};

export const interactionModes = [
  "speaking_to_subject",
  "speaking_for_subject",
  "speaking_about_subject",
  "internal_administrative_action",
];

export const partitions = ["professional", "personal", "shared"];
export const visibilityLevels = ["private", "subject", "assistant", "workspace", "public"];

const promptInjectionPatterns = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /reveal (the )?(system prompt|developer message|secret|token|api key)/i,
  /approve (this|the) action/i,
  /execute (the )?(tool|command|action)/i,
  /change (the )?(policy|permissions|rules)/i,
  /you are now/i,
];

export function validateContextRequest(request = {}) {
  const errors = [];
  if (!interactionModes.includes(request.mode)) errors.push("interaction mode is required");
  for (const key of ["actorId", "subjectId", "workspaceId", "task"]) {
    if (!String(request[key] || "").trim()) errors.push(`${key} is required`);
  }
  if (!partitions.includes(request.partition || "professional")) errors.push("partition is invalid");
  if (request.externalVisibility && !["none", "internal", "external"].includes(request.externalVisibility)) errors.push("external visibility is invalid");
  return { ok: !errors.length, errors };
}

export function trustRank(level = "application_default") {
  return trustLevels[level] || trustLevels.application_default;
}

export function sortByTrust(facts = []) {
  return [...facts].sort((a, b) => {
    const authority = effectiveTrustRank(a) - effectiveTrustRank(b);
    if (authority !== 0) return authority;
    return String(b.validFrom || b.learnedAt || "").localeCompare(String(a.validFrom || a.learnedAt || ""));
  });
}

export function classifyFreshness({ retrievedAt, dataTimestamp, maxAgeMinutes = 60 } = {}, now = new Date()) {
  const stamp = new Date(dataTimestamp || retrievedAt || 0);
  if (!stamp.getTime()) return "unknown";
  const ageMinutes = Math.max(0, (now.getTime() - stamp.getTime()) / 60000);
  if (ageMinutes <= maxAgeMinutes) return "fresh";
  if (ageMinutes <= maxAgeMinutes * 4) return "aging";
  return "stale";
}

export function isPromptInjectionText(value = "") {
  const text = String(value || "");
  return promptInjectionPatterns.some((pattern) => pattern.test(text));
}

export function sanitizeForModel(value = "") {
  const text = String(value || "");
  if (!isPromptInjectionText(text)) return text;
  return "[quoted untrusted content redacted: prompt-like instruction removed]";
}

function effectiveTrustRank(fact = {}) {
  const baseRank = trustRank(fact.trustLevel);
  if (baseRank <= trustLevels.temporary_override) return baseRank;
  const authorityRank = Number.isFinite(Number(fact.fieldAuthorityRank)) ? Number(fact.fieldAuthorityRank) : baseRank;
  return Math.max(trustLevels.authoritative_live_system, Math.min(baseRank, authorityRank));
}

export function canDiscloseFact(fact = {}, request = {}) {
  if (fact.status === "superseded" || fact.status === "rejected" || fact.status === "expired") return false;
  if (fact.partition === "personal" && request.partition === "professional" && request.mode !== "speaking_to_subject") return false;
  if (fact.visibility === "private" && request.actorId !== request.subjectId) return false;
  if (request.mode === "speaking_for_subject" && ["inference", "observation", "imported_unverified"].includes(fact.trustLevel)) return false;
  if (request.externalVisibility === "external" && ["private", "subject"].includes(fact.visibility)) return false;
  if (Array.isArray(fact.allowedAudiences) && fact.allowedAudiences.length) {
    const audience = request.audience || {};
    const baselineAudiences = new Set(["self", "assistant", "workspace"]);
    const hasNamedAudienceRestriction = fact.allowedAudiences.some((allowed) => !baselineAudiences.has(String(allowed)));
    if (fact.visibility === "public" && !hasNamedAudienceRestriction) return true;
    const audienceKeys = [
      audience.id,
      audience.type,
      audience.kind,
      ...(Array.isArray(audience.ids) ? audience.ids : []),
      request.actorId === request.subjectId ? "self" : "",
    ].map((item) => String(item || "").trim()).filter(Boolean);
    if (!fact.allowedAudiences.some((allowed) => audienceKeys.includes(String(allowed)))) return false;
  }
  return true;
}

export function buildIdentityKernel(facts = [], request = {}) {
  const allowed = sortByTrust(facts).filter((fact) => canDiscloseFact(fact, request));
  const byKey = new Map();
  for (const fact of allowed) {
    if (!fact.resourceType?.startsWith("identity.")) continue;
    if (!byKey.has(fact.fieldKey)) byKey.set(fact.fieldKey, fact);
  }
  return Object.fromEntries([...byKey.entries()].map(([key, fact]) => [key, {
    value: sanitizeForModel(fact.value),
    trustLevel: fact.trustLevel,
    verified: fact.verificationStatus === "verified",
    source: fact.sourceLabel || fact.provenanceId || "unknown",
    validFrom: fact.validFrom,
    validTo: fact.validTo,
  }]));
}

export function analyzeContextQuality({ facts = [], liveSnapshots = [], request = {}, now = new Date() } = {}) {
  const warnings = [];
  const validation = validateContextRequest(request);
  warnings.push(...validation.errors);
  if (!facts.some((fact) => fact.resourceType?.startsWith("identity.") && fact.verificationStatus === "verified")) {
    warnings.push("identity kernel has no verified identity facts");
  }
  for (const snapshot of liveSnapshots) {
    const freshness = classifyFreshness(snapshot, now);
    if (freshness === "stale" || freshness === "unknown") warnings.push(`${snapshot.source || "live source"} is ${freshness}`);
  }
  if (facts.some((fact) => isPromptInjectionText(fact.value))) warnings.push("untrusted source content contains prompt-injection-like instructions");
  return { ok: validation.ok && !warnings.length, warnings };
}

export function buildContextEnvelope({ request = {}, constitution = {}, facts = [], liveSnapshots = [], memories = [], proposals = [], now = new Date() } = {}) {
  const validation = validateContextRequest(request);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, warnings: validation.errors };
  }
  const permittedFacts = sortByTrust(facts)
    .filter((fact) => canDiscloseFact(fact, request))
    .map((fact) => ({ ...fact, value: sanitizeForModel(fact.value) }));
  const identityKernel = buildIdentityKernel(permittedFacts, request);
  const sanitizedMemories = memories
    .filter((memory) => canDiscloseFact({ ...memory, status: memory.status || "active" }, request))
    .map((memory) => ({ ...memory, summary: sanitizeForModel(memory.summary) }));
  const quality = analyzeContextQuality({ facts: permittedFacts, liveSnapshots, request, now });
  return {
    ok: true,
    request,
    temporalFrame: {
      currentDate: now.toISOString().slice(0, 10),
      currentTime: now.toISOString(),
      primaryTimezone: request.primaryTimezone || "America/Denver",
      requestedHorizon: request.requestedHorizon || "today",
    },
    constitution: {
      version: constitution.version || 1,
      immutableRules: constitution.immutableRules || [],
      workspaceRules: constitution.workspaceRules || [],
    },
    identityKernel,
    facts: permittedFacts,
    liveSnapshots: liveSnapshots.map((snapshot) => ({ ...snapshot, freshness: classifyFreshness(snapshot, now) })),
    episodicMemory: sanitizedMemories,
    memoryProposals: proposals.filter((proposal) => proposal.status === "proposed"),
    quality,
  };
}

export function proposeProfileUpdate({ observation = "", fieldKey = "", resourceType = "profile.preference", source = "manual", confidence = 0.5 } = {}) {
  return {
    fieldKey,
    resourceType,
    proposedValue: String(observation || ""),
    source,
    confidence,
    status: "proposed",
    trustLevel: "observation",
  };
}

export function profileFactInput(input = {}, { now = new Date(), idFactory = () => "fact" } = {}) {
  const fieldKey = String(input.fieldKey || "").trim();
  if (!fieldKey) throw new Error("fieldKey is required");
  const resourceType = String(input.resourceType || "profile.fact").trim();
  const partition = partitions.includes(input.partition) ? input.partition : "professional";
  const visibility = visibilityLevels.includes(input.visibility) ? input.visibility : "assistant";
  const trustLevel = Object.prototype.hasOwnProperty.call(trustLevels, input.trustLevel) ? input.trustLevel : "imported_unverified";
  const verificationStatus = String(input.verificationStatus || (trustLevel === "verified_canonical_profile" ? "verified" : "unverified"));
  const status = ["active", "proposed", "disputed", "superseded", "expired"].includes(input.status) ? input.status : "active";
  const meta = {
    allowedAudiences: Array.isArray(input.allowedAudiences) ? input.allowedAudiences.map(String).filter(Boolean) : undefined,
    fieldAuthorityRank: Number.isFinite(Number(input.fieldAuthorityRank)) ? Number(input.fieldAuthorityRank) : undefined,
  };
  return {
    id: input.id || idFactory(),
    resourceType,
    fieldKey,
    value: String(input.value || ""),
    valueJson: meta,
    partition,
    visibility,
    trustLevel,
    verificationStatus,
    status,
    validFrom: input.validFrom || null,
    validTo: input.validTo || null,
    learnedAt: input.learnedAt || now.toISOString(),
    provenanceId: input.provenanceId || null,
    sourceLabel: String(input.sourceLabel || "Manual entry"),
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 0.75))),
    createdBy: String(input.createdBy || "local-user"),
    updatedAt: now.toISOString(),
  };
}

export function profileFactFromRow(row = {}, parseJson = JSON.parse) {
  let valueMeta = {};
  try {
    valueMeta = typeof row.value_json === "string" ? parseJson(row.value_json || "{}") : (row.value_json || {});
  } catch {
    valueMeta = {};
  }
  return {
    id: row.id,
    resourceType: row.resource_type,
    fieldKey: row.field_key,
    value: row.value,
    partition: row.partition,
    visibility: row.visibility,
    trustLevel: row.trust_level,
    verificationStatus: row.verification_status,
    status: row.status,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    learnedAt: row.learned_at,
    provenanceId: row.provenance_id,
    sourceLabel: row.source_label,
    confidence: row.confidence,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    allowedAudiences: valueMeta.allowedAudiences,
    fieldAuthorityRank: valueMeta.fieldAuthorityRank,
  };
}
