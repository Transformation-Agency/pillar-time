const defaultOwnerName = "You";

export function localPreferenceHints(briefPrompt = "") {
  const lower = String(briefPrompt || "").toLowerCase();
  const hints = [];
  if (/\bright[-\s]?wing\b|\bconservative\b|\bgop\b|\brepublican\b/.test(lower)) hints.push("preserve the right-leaning/conservative frame");
  if (/\bleft[-\s]?wing\b|\bprogressive\b|\bdemocrat(ic)?\b|\bdems\b/.test(lower)) hints.push("preserve stated political-party or ideological preferences");
  if (/\bprefer\b|\balign\b|\bavoid\b|\bdon't\b|\bnot just\b|\bmainly\b|\bfocus\b|\blook mainly\b/.test(lower)) hints.push("carry over explicit preferences, exclusions, and source priorities");
  if (/\blameness\b|\blame\b|\babsurd\b|\bfailure\b|\bweakness\b/.test(lower)) hints.push("preserve critique angles as source-grounded sentiment/framing");
  if (/\bx\b|\btwitter\b|\breddit\b/.test(lower)) hints.push("prioritize requested X/Reddit sentiment");
  return hints;
}

export function defaultCalendarBriefSection() {
  return {
    key: "calendarAgenda",
    label: "Today's Calendar",
    enabled: true,
    instruction: "Use today's connected calendar events to prepare me for the day: meetings, schedule shape, likely prep needs, conflicts, sequencing, focus blocks, and follow-up reminders. Treat calendar entries as private schedule context, not news.",
    promptTarget: "standard",
    promptRefId: "",
  };
}

export function putCalendarBriefSectionFirst(sections = [], addIfConnected = false) {
  const usableSections = Array.isArray(sections) ? sections.filter(Boolean) : [];
  const existing = usableSections.find((section) => section?.key === "calendarAgenda");
  if (!existing && !addIfConnected) return usableSections;
  const calendarSection = existing ? { ...defaultCalendarBriefSection(), ...existing, key: "calendarAgenda" } : defaultCalendarBriefSection();
  return [calendarSection, ...usableSections.filter((section) => section?.key !== "calendarAgenda")];
}

export function localBriefSetupDraft(briefPrompt = "", current = {}) {
  const owner = current.ownerName || defaultOwnerName;
  const prompt = String(briefPrompt || "").toLowerCase();
  const preferenceHints = localPreferenceHints(briefPrompt);
  const preferenceText = preferenceHints.length ? ` Preserve these preferences: ${preferenceHints.join("; ")}.` : "";
  const topics = [];
  if (prompt.includes("crypto")) topics.push("crypto");
  if (prompt.includes("ai")) topics.push("AI");
  if (prompt.includes("politic")) topics.push("politics");
  if (prompt.includes("movie") || prompt.includes("hollywood")) topics.push("movies/Hollywood");
  if (prompt.includes("market")) topics.push("markets");
  if (prompt.includes("reddit")) topics.push("Reddit sentiment");
  if (prompt.includes("x ") || prompt.includes("twitter")) topics.push("X sentiment");
  const topicText = topics.length ? topics.join(", ") : "the topics in the brief request";
  return {
    ...current,
    ownerName: owner,
    productName: current.productName || "Pillar Time",
    audienceContext: `A private daily brief for ${owner} focused on ${topicText}. Use only source items published today, with enough context to understand why they matter.${preferenceText}`,
    voiceRules: `Natural, direct, and useful. Prefer plain English, sharp bullets, and concrete takeaways. Avoid corporate stiffness, filler, fake certainty, and false-balance flattening of stated preferences.${preferenceHints.length ? " Keep stated worldview/taste/source preferences visible when source evidence supports them." : ""}`,
    sections: putCalendarBriefSectionFirst([
      { key: "topSignals", label: "Top Signals", enabled: true, instruction: "Lead with the most important items published today. Keep each item clear, specific, and tied to why it matters.", promptTarget: "standard", promptRefId: "" },
      { key: "sentimentRead", label: "Sentiment Read", enabled: true, instruction: `Summarize what people seem to be reacting to on X, Reddit, and other configured sources. Separate real signal from noise.${preferenceHints.length ? " Preserve the user's stated worldview/source preferences in the read when grounded in today's sources." : ""}`, promptTarget: "standard", promptRefId: "" },
      { key: "politicalRace", label: "Political Race", enabled: prompt.includes("politic") || prompt.includes("race"), instruction: `Cover meaningful political-race developments, polling signals, campaign moves, and narrative shifts from today.${preferenceHints.length ? " Keep explicit political framing preferences intact instead of smoothing them into generic neutrality." : ""}`, promptTarget: "standard", promptRefId: "" },
      { key: "industryMotion", label: "Industry Motion", enabled: true, instruction: "Explain production, market, industry, or business implications behind the day’s items, not just gossip or surface chatter.", promptTarget: "standard", promptRefId: "" },
      { key: "marketImpact", label: "Market Impact", enabled: prompt.includes("market") || prompt.includes("crypto"), instruction: "Call out how the day’s events may affect markets, risk appetite, crypto, AI, or broader sentiment.", promptTarget: "standard", promptRefId: "" },
      { key: "whatToWatch", label: "What To Watch Next", enabled: true, instruction: "End with the next developments, questions, or indicators worth watching over the next 24-72 hours.", promptTarget: "standard", promptRefId: "" },
      { key: "sourceEvidence", label: "Source Evidence", enabled: true, instruction: "List the source items used, with links where available. Only include items published today.", promptTarget: "standard", promptRefId: "" },
    ], current.calendarConnected),
  };
}

export function briefSetupDraftRequest({ briefPrompt, ownerName }) {
  return {
    url: "/api/onboarding/brief-setup-draft",
    method: "POST",
    body: {
      briefPrompt,
      ownerName,
    },
  };
}

export function briefSetupDraftMessage(draft = {}, fallback = false) {
  const count = (draft.sections || []).length;
  return fallback
    ? `Built a starter setup because the model draft was incomplete. Review and apply ${count} sections.`
    : `Drafted ${count} brief sections. Review and apply them.`;
}

export function shouldUseLocalBriefSetupFallback(error) {
  const message = String(error?.message || error || "");
  return /not found|cannot\s+(post|get)|404|model|api key|key|provider|rate limit|timeout/i.test(message);
}

export function localBriefSetupDraftMessage(draft = {}) {
  return `Built a starter setup locally. Review and apply ${(draft.sections || []).length} sections.`;
}

export function briefSetupApplyRequest(draft) {
  return {
    url: "/api/onboarding/brief-setup-apply",
    method: "POST",
    body: { draft },
  };
}

export function briefSetupApplyFallbackRequests({
  draft,
  briefPrompt,
  sourceSuggestions = [],
}) {
  return [
    {
      url: "/api/brief-config",
      method: "PATCH",
      body: draft,
    },
    {
      url: "/api/onboarding",
      method: "PATCH",
      body: {
        currentStep: "sources",
        briefPrompt,
        sourceSuggestions,
        briefConfigDraft: draft,
      },
    },
  ];
}
