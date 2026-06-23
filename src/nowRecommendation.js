const WIP_LIMITS = {
  activeObjectives: 3,
  activeCommitments: 5,
  todaysThree: 3,
};

const LEVERAGE_WEIGHTS = {
  unblock: 34,
  launchRevenue: 30,
  leadership: 26,
  deadline: 24,
  deepWork: 22,
  healthFamilyRecovery: 18,
  admin: 10,
};

const ENERGY_FIT = {
  clear: ["deepWork", "launchRevenue", "unblock"],
  creative: ["deepWork", "launchRevenue"],
  social: ["leadership", "unblock"],
  administrative: ["admin", "deadline"],
  tired: ["admin", "healthFamilyRecovery"],
  foggy: ["admin", "healthFamilyRecovery"],
  anxious: ["unblock", "deadline", "healthFamilyRecovery"],
  recovery: ["healthFamilyRecovery", "admin"],
  fragmented: ["admin", "deadline"],
  travel: ["admin", "leadership"],
};

export const timeWindowOptions = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 120, label: "120 minutes" },
];

export const energyStateOptions = [
  { value: "clear", label: "Clear / deep work" },
  { value: "creative", label: "Creative" },
  { value: "social", label: "Social" },
  { value: "administrative", label: "Administrative" },
  { value: "tired", label: "Tired" },
  { value: "foggy", label: "Foggy" },
  { value: "anxious", label: "Anxious" },
  { value: "recovery", label: "Recovery" },
  { value: "fragmented", label: "Fragmented" },
  { value: "travel", label: "Travel / logistics" },
];

function text(value = "") {
  return String(value || "").trim();
}

function latestMorningBrief(state = {}) {
  return (state.workflowRuns || [])
    .filter((run) => run.status === "completed" && (run.runType === "executive_day" || run.artifact?.renderedBrief || run.artifact?.onePageBrief))
    .sort((a, b) => new Date(b.completedAt || b.startedAt || 0) - new Date(a.completedAt || a.startedAt || 0))[0] || null;
}

export function morningBriefPlanningContext(state = {}) {
  const run = latestMorningBrief(state);
  const artifact = run?.artifact || {};
  const briefText = artifact.renderedBrief || artifact.onePageBrief || "";
  const recommendations = [
    ...(artifact.todaysThree || []),
    ...(artifact.todaysThreeRead || []),
    ...(artifact.highestLeverageRead || []),
    ...(artifact.proposedActions || []),
  ].map((item) => typeof item === "string" ? item : item?.title || item?.reason || "").filter(Boolean);
  return {
    runId: run?.id || "",
    title: artifact.title || run?.label || "Morning brief",
    available: !!run,
    generatedAt: run?.completedAt || artifact.generatedAt || "",
    briefText,
    recommendations,
    missingInformation: artifact.missingInfo || artifact.missingInformation || [],
    approvalItems: artifact.approvalItems || [],
    risks: artifact.risks || [],
  };
}

function candidateText(candidate = {}) {
  return `${candidate.title || ""} ${candidate.notes || ""} ${candidate.reason || ""}`.toLowerCase();
}

function dueSoonScore(candidate = {}, now = new Date()) {
  if (!candidate.dueAt) return 0;
  const due = new Date(candidate.dueAt);
  if (Number.isNaN(due.getTime())) return 0;
  const hours = Math.ceil((due.getTime() - now.getTime()) / 3600000);
  if (hours < 0) return 22;
  if (hours <= 24) return 18;
  if (hours <= 72) return 10;
  return 3;
}

function feedbackPenalty(candidate = {}, feedback = []) {
  const key = candidate.feedbackKey || candidate.id || candidate.title;
  const matches = feedback.filter((item) => item?.key === key || item?.key === candidate.id || item?.key === candidate.title);
  let penalty = 0;
  for (const item of matches) {
    if (item.feedback === "never") penalty = Math.max(penalty, 80);
    else if (item.feedback === "wrongPriority" || item.feedback === "incorrect") penalty = Math.max(penalty, 30);
    else if (item.feedback === "blocked") penalty = Math.max(penalty, 24);
    else if (item.feedback === "notToday" || item.feedback === "defer") penalty = Math.max(penalty, 18);
    else if (item.feedback === "alreadyDone") penalty = Math.max(penalty, 60);
    else if (item.feedback === "useful" || item.feedback === "moreLikeThis") penalty -= 8;
  }
  return penalty;
}

function authorityForCandidate(candidate = {}) {
  if (candidate.approvalRequired || candidate.source === "calendar_schedule" || candidate.source === "linear_write") {
    return {
      status: "approval_required",
      label: "Approval required",
      canRecommend: true,
      canExecute: false,
      detail: "Contact Lens may draft or prepare this, but the human must approve before any external action.",
    };
  }
  return {
    status: "recommend_only",
    label: "Recommend only",
    canRecommend: true,
    canExecute: false,
    detail: "Contact Lens may observe, rank, recommend, draft, remind, and prepare. It cannot decide or execute for the human.",
  };
}

function morningBriefScore(candidate = {}, context = {}) {
  if (!context.available) return 0;
  const haystack = `${context.briefText} ${context.recommendations.join(" ")}`.toLowerCase();
  if (!haystack) return 0;
  const title = text(candidate.title).toLowerCase();
  if (title && haystack.includes(title.slice(0, Math.min(32, title.length)))) return 18;
  const words = title.split(/\W+/).filter((word) => word.length > 4);
  return words.some((word) => haystack.includes(word)) ? 10 : 0;
}

function energyScore(candidate = {}, energyState = "clear") {
  const category = candidate.leverageCategory || "admin";
  return (ENERGY_FIT[energyState] || ENERGY_FIT.clear).includes(category) ? 10 : -8;
}

function timeFitScore(candidate = {}, windowMinutes = 30) {
  const estimate = Number(candidate.estimateMinutes || 30);
  if (estimate <= windowMinutes) return 12;
  if (estimate <= windowMinutes * 1.5) return 2;
  return -20;
}

function objectiveAlignmentScore(candidate = {}) {
  const body = candidateText(candidate);
  if (candidate.objectiveId || candidate.goal || candidate.project) return 14;
  if (/objective|okr|investor|fundrais|launch|customer|sales|revenue|write|build|ship/.test(body)) return 10;
  return 0;
}

function bottleneckScore(candidate = {}) {
  const body = candidateText(candidate);
  if (candidate.leverageCategory === "unblock" || candidate.waitingOn || /block|waiting|unblock|decision|stuck|constraint|bottleneck/.test(body)) return 16;
  return 0;
}

function riskScore(candidate = {}) {
  if (candidate.status === "blocked" || candidate.blocked) return -26;
  if (candidate.riskLevel === "high") return -16;
  if (candidate.approvalRequired) return -8;
  return 6;
}

function scoreCandidate(candidate = {}, context = {}) {
  const category = candidate.leverageCategory || "admin";
  const authority = authorityForCandidate(candidate);
  const factors = [
    { key: "authority", label: authority.label, score: authority.canRecommend ? 8 : -100 },
    { key: "risk", label: candidate.status === "blocked" ? "Blocked or risky" : "Low-risk recommendation", score: riskScore(candidate) },
    { key: "objective", label: "Objective alignment", score: objectiveAlignmentScore(candidate) },
    { key: "bottleneck", label: "Bottleneck relief", score: bottleneckScore(candidate) },
    { key: "leverage", label: "Leverage", score: LEVERAGE_WEIGHTS[category] || LEVERAGE_WEIGHTS.admin },
    { key: "timeFit", label: `Fits ${context.windowMinutes || 30} minutes`, score: timeFitScore(candidate, context.windowMinutes) },
    { key: "energyFit", label: `Energy fit: ${context.energyState || "clear"}`, score: energyScore(candidate, context.energyState) },
    { key: "deadline", label: "Deadline pressure", score: dueSoonScore(candidate, context.nowDate) },
    { key: "flow", label: candidate.source === "task" ? "Low context-switch cost" : "Context switch cost", score: candidate.source === "task" ? 8 : 0 },
    { key: "morningBrief", label: "Morning brief relevance", score: morningBriefScore(candidate, context.morningBrief) },
    { key: "confidence", label: "Evidence confidence", score: Math.round((candidate.confidence ?? 0.58) * 10) },
    { key: "feedback", label: "Feedback history", score: -feedbackPenalty(candidate, context.feedback) },
  ];
  const score = factors.reduce((sum, factor) => sum + factor.score, 0);
  return {
    ...candidate,
    authority,
    constitutionalScore: score,
    scoreBreakdown: factors,
    confidence: Math.max(0.15, Math.min(0.95, candidate.confidence ?? (candidate.reason ? 0.72 : 0.56))),
  };
}

export function recommendationCandidates(state = {}) {
  const time = state.time || {};
  const suggestions = (time.suggestions || []).map((item) => ({ ...item, source: item.source || "suggestion" }));
  const commitments = (time.commitments || []).filter((item) => item.status !== "removed").map((item) => ({
    id: `daily:${item.id}`,
    feedbackKey: item.sourceSuggestionId || item.id,
    title: item.title,
    notes: item.notes,
    leverageCategory: "leadership",
    source: "commitment",
    estimateMinutes: 30,
    confidence: 0.78,
    reason: "User-confirmed commitment for today.",
  }));
  const canonical = (time.canonicalCommitments || []).map((item) => ({
    id: `commitment:${item.id}`,
    feedbackKey: item.id,
    title: item.nextAction || item.title,
    notes: item.description,
    dueAt: item.dueAt,
    leverageCategory: item.leverageCategory || "leadership",
    source: "canonical_commitment",
    estimateMinutes: item.estimateMinutes || 30,
    status: item.status,
    waitingOn: item.waitingOn,
    confidence: Number(item.confidence || 0.7),
    reason: item.waitingOn ? `Waiting on ${item.waitingOn}; clarify or unblock it.` : "Canonical commitment in the executive record.",
  }));
  const tasks = (time.tasks || []).slice(0, 12).map((item) => ({
    ...item,
    id: `task:${item.id}`,
    feedbackKey: item.id,
    source: "task",
    confidence: 0.62,
    reason: item.reason || item.notes || "Open planner task.",
  }));
  return [...commitments, ...suggestions, ...canonical, ...tasks].filter((item, index, all) => {
    const key = item.feedbackKey || item.id || item.title;
    return key && all.findIndex((other) => (other.feedbackKey || other.id || other.title) === key) === index;
  });
}

export function wipAssessment(state = {}) {
  const time = state.time || {};
  const activeCommitments = (time.commitments || []).filter((item) => item.status === "active").length;
  const canonicalCommitments = (time.canonicalCommitments || []).filter((item) => !["done", "canceled", "removed"].includes(item.status)).length;
  const activeObjectives = (time.objectives || []).filter((item) => item.status === "active").length;
  const warnings = [];
  if (activeCommitments > WIP_LIMITS.todaysThree) warnings.push(`Today's Three has ${activeCommitments}; cap it at ${WIP_LIMITS.todaysThree}.`);
  if (canonicalCommitments > WIP_LIMITS.activeCommitments) warnings.push(`${canonicalCommitments} active commitments exceeds the recommended limit of ${WIP_LIMITS.activeCommitments}.`);
  if (activeObjectives > WIP_LIMITS.activeObjectives) warnings.push(`${activeObjectives} active objectives exceeds the recommended limit of ${WIP_LIMITS.activeObjectives}.`);
  return {
    activeCommitments,
    canonicalCommitments,
    activeObjectives,
    warnings,
    overloaded: warnings.length > 0,
  };
}

export function whatShouldIDoNow(state = {}, { windowMinutes = 30, energyState = "clear", nowDate = new Date() } = {}) {
  const morningBrief = morningBriefPlanningContext(state);
  const feedback = state.time?.suggestionFeedback || [];
  const wip = wipAssessment(state);
  const context = { windowMinutes: Number(windowMinutes || 30), energyState, nowDate, morningBrief, feedback };
  const ranked = recommendationCandidates(state).map((candidate) => scoreCandidate(candidate, context))
    .sort((a, b) => b.constitutionalScore - a.constitutionalScore || String(a.title).localeCompare(String(b.title)));
  const available = ranked.filter((candidate) => candidate.status !== "blocked" && candidate.constitutionalScore > -20);
  const primary = available[0] || null;
  const fallback = available.find((candidate) => candidate.id !== primary?.id && Number(candidate.estimateMinutes || 30) <= context.windowMinutes) || available[1] || null;
  const avoid = ranked.find((candidate) => candidate.status === "blocked")
    || [...ranked].reverse().find((candidate) => candidate.id !== primary?.id && candidate.id !== fallback?.id)
    || null;
  const nextAction = primary
    ? exactNextAction(primary, context.windowMinutes)
    : "Capture one concrete obligation or generate the morning brief so Pillar Time has enough context to rank the day.";
  return {
    primary,
    fallback,
    avoid,
    nextAction,
    ranked,
    morningBrief,
    wip,
    authorityBoundary: {
      label: "Contact Lens boundary",
      detail: "Pillar Time may observe, classify, rank, summarize, draft, remind, prepare, ask for clarification, and propose. It cannot decide for you or execute external actions without explicit approval.",
    },
    auditPreview: {
      consideredCount: ranked.length,
      selectedPrimaryId: primary?.id || "",
      fallbackId: fallback?.id || "",
      avoidId: avoid?.id || "",
      morningBriefRunId: morningBrief.runId,
      generatedAt: nowDate.toISOString(),
    },
  };
}

function exactNextAction(candidate = {}, windowMinutes = 30) {
  const estimate = Number(candidate.estimateMinutes || 30);
  if (candidate.source === "calendar") return `Open the meeting notes and write the decision, agenda, and one question before the event. Keep it inside ${Math.min(estimate, windowMinutes)} minutes.`;
  if (candidate.source === "linear") return "Open the Linear issue, write the next concrete status or blocker, then move only the smallest next step.";
  if (candidate.waitingOn) return `Clarify the waiting-on item for ${candidate.waitingOn}, then send or draft the smallest unblock request.`;
  return `Work on "${candidate.title}" for ${Math.min(estimate, windowMinutes)} minutes. Stop when the next visible artifact or decision is produced.`;
}
