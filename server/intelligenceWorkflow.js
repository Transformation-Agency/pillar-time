export const NO_NEWS_FRESHNESS_POLICY = "Selected issue clusters have publishedAt dates from today only. Calendar is agenda only. Never say 'no news' for a section when coverageDiagnostics shows relevant coverage was degraded or relevant unselected candidates existed.";

export function coverageForResults(type, results = []) {
  const rows = Array.isArray(results) ? results : [];
  return {
    type,
    attempted: rows.length,
    succeeded: rows.filter((result) => result.ok !== false && !result.skipped).length,
    failed: rows.filter((result) => result.ok === false).length,
    skipped: rows.filter((result) => result.skipped).length,
    fetched: rows.reduce((sum, result) => sum + Number(result.seen || result.today || result.fetched || 0), 0),
    today: rows.reduce((sum, result) => sum + Number(result.today || 0), 0),
    inserted: rows.reduce((sum, result) => sum + Number(result.inserted || 0), 0),
    reused: rows.reduce((sum, result) => sum + Number(result.reused || result.preflight || 0), 0),
  };
}

export function buildCoverageDiagnostics({ activeSources = [], sourceResults = {}, itemCount = 0, candidateCount = 0, calendarAgenda = [], generatedAt = new Date().toISOString() } = {}) {
  const groups = {
    x: coverageForResults("X", sourceResults.xFetches),
    rss: coverageForResults("RSS/YouTube", sourceResults.rssFetches),
    reddit: coverageForResults("Reddit", sourceResults.redditFetches),
    web: coverageForResults("Web", sourceResults.webFetches),
    calendar: coverageForResults("Calendar", sourceResults.calendarFetches),
    podcast: coverageForResults("Podcast", sourceResults.podcastTranscriptions),
  };
  const topFailures = [];
  for (const [type, rows] of Object.entries({
    x: sourceResults.xFetches || [],
    rss: sourceResults.rssFetches || [],
    reddit: sourceResults.redditFetches || [],
    web: sourceResults.webFetches || [],
    calendar: sourceResults.calendarFetches || [],
    podcast: sourceResults.podcastTranscriptions || [],
  })) {
    for (const result of rows) {
      if (result?.ok === false) topFailures.push({
        type,
        source: result.sourceName || result.source || result.name || result.url || result.sourceId || "Unknown source",
        error: String(result.error || result.reason || "Unknown failure").slice(0, 260),
      });
    }
  }
  const warnings = [];
  if (groups.reddit.failed) warnings.push(`Reddit coverage degraded: ${groups.reddit.failed} source${groups.reddit.failed === 1 ? "" : "s"} failed, often due to 403/429 access limits.`);
  const unsupportedX = topFailures.filter((failure) => failure.type === "x" && /(min_faves|filter:news|unsupported)/i.test(failure.error));
  if (unsupportedX.length) warnings.push(`Some X searches used unsupported operators and were not counted as reliable coverage: ${unsupportedX.map((failure) => failure.source).slice(0, 4).join(", ")}.`);
  if (groups.x.failed) warnings.push(`X coverage degraded: ${groups.x.failed} search${groups.x.failed === 1 ? "" : "es"} failed.`);
  if (groups.rss.failed) warnings.push(`RSS/YouTube coverage degraded: ${groups.rss.failed} feed${groups.rss.failed === 1 ? "" : "s"} failed or blocked.`);
  if (!candidateCount && itemCount) warnings.push("Sources fetched items, but no same-day non-calendar news candidates qualified for ranking.");
  return {
    generatedAt,
    activeSourceCount: activeSources.length,
    itemCount,
    candidateCount,
    calendarAgendaCount: calendarAgenda.length,
    byType: groups,
    topFailures: topFailures.slice(0, 18),
    warnings,
  };
}

export function selectIssueClusters(clusters = [], min = 12, max = 18) {
  const selected = [];
  const selectedIds = new Set();
  const addBestForTag = (tag, count = 1) => {
    for (const cluster of clusters) {
      if (selected.length >= max) return;
      if (selectedIds.has(cluster.id) || !cluster.sectionTags.includes(tag)) continue;
      selected.push(cluster);
      selectedIds.add(cluster.id);
      if (selected.filter((item) => item.sectionTags.includes(tag)).length >= count) return;
    }
  };
  addBestForTag("politicalNational", 2);
  addBestForTag("financialMarkets", 2);
  addBestForTag("boulderLocal", 1);
  addBestForTag("coloradoRegional", 1);
  addBestForTag("worldGeopolitics", 1);
  for (const cluster of clusters) {
    if (selected.length >= max) break;
    if (selectedIds.has(cluster.id)) continue;
    const techScienceCount = selected.filter((item) => item.sectionTags.includes("techAi") || item.sectionTags.includes("scienceHealth")).length;
    if (techScienceCount < 2 && (cluster.sectionTags.includes("techAi") || cluster.sectionTags.includes("scienceHealth"))) {
      selected.push(cluster);
      selectedIds.add(cluster.id);
    }
  }
  for (const cluster of clusters) {
    if (selected.length >= Math.min(max, Math.max(min, clusters.length))) break;
    if (selectedIds.has(cluster.id)) continue;
    selected.push(cluster);
    selectedIds.add(cluster.id);
  }
  return selected.sort((a, b) => b.score - a.score).slice(0, max);
}

export function noNewsClaimPolicy({ coverageDiagnostics = {}, candidateScan = {}, sectionCandidateCount = 0 } = {}) {
  const warnings = Array.isArray(coverageDiagnostics.warnings) ? coverageDiagnostics.warnings : [];
  const failures = Array.isArray(coverageDiagnostics.topFailures) ? coverageDiagnostics.topFailures : [];
  const scannedIssueUnits = Number(candidateScan.clusterCount ?? candidateScan.totalCandidates ?? coverageDiagnostics.candidateCount ?? 0);
  const unselectedCandidates = Math.max(0, scannedIssueUnits - Number(candidateScan.selectedClusterCount || 0));
  const hasDegradedCoverage = warnings.length > 0 || failures.length > 0;
  const canClaimNoNews = !hasDegradedCoverage && !unselectedCandidates && !sectionCandidateCount;
  return {
    canClaimNoNews,
    hasDegradedCoverage,
    unselectedCandidates,
    warning: canClaimNoNews
      ? ""
      : "Do not claim there was no news; disclose degraded coverage or say no qualifying item was selected from available candidates.",
    sourceFreshnessPolicy: NO_NEWS_FRESHNESS_POLICY,
  };
}

export function knownSectionContent(brief = {}, key = "") {
  const map = {
    executiveRead: brief.executiveRead,
    backgroundContext: brief.backgroundContext,
    whyJackShouldCare: brief.whyJackShouldCare,
    whyItMatters: brief.whyJackShouldCare,
    futureImplications: brief.futureImplications,
    doctrineProjectImpact: brief.doctrineProjectImpact,
    councilRead: brief.councilRead,
    councilSynthesis: brief.councilSynthesis,
    jackPov: brief.jackPov,
    pov: brief.jackPov,
    openQuestions: brief.openQuestions,
    topSignals: brief.executiveRead,
    sentimentRead: brief.backgroundContext,
    politicalRace: brief.whyJackShouldCare,
    industryMotion: brief.doctrineProjectImpact,
    marketImpact: brief.futureImplications,
    whatToWatch: brief.openQuestions,
  };
  return map[key];
}

export function fallbackSectionContent(section = {}, selectedIssues = [], config = {}) {
  if (!selectedIssues.length) return "No usable source items published today for this section.";
  const label = String(section.label || section.key || "Section").toLowerCase();
  const owner = config.ownerName || "the brief owner";
  if (label.includes("signal") || label.includes("top")) {
    return selectedIssues.slice(0, 5).map((issue) => `${issue.title}: ${issue.summary || issue.whyJackShouldCare || "Monitor this as a source-backed signal from today."}`);
  }
  if (label.includes("sentiment")) {
    return selectedIssues.slice(0, 5).map((issue) => `${issue.sourceName}: reaction centers on "${issue.title}". Treat the chatter as directional until corroborated.`);
  }
  if (label.includes("politic") || label.includes("race")) {
    return selectedIssues.slice(0, 5).map((issue) => `${issue.title}: ${issue.whyJackShouldCare || "Review the owner-relevant angle before acting on it."}`);
  }
  if (label.includes("market") || label.includes("impact")) {
    return selectedIssues.slice(0, 4).map((issue) => `${issue.title}: ${issue.futureImplication || "Track whether this changes timing, allocation, or messaging."}`);
  }
  if (label.includes("watch")) {
    return [
      "Which stories get corroborated by more than one source type?",
      `Which items actually change ${owner}'s decisions, priorities, or watchlist?`,
      "Which claims need primary-source verification before relying on them?",
    ];
  }
  return selectedIssues.slice(0, 4).map((issue) => `${issue.title}: ${issue.summary || issue.whyJackShouldCare || "Worth monitoring from today's sources."}`);
}

export function renderOnePageBrief(artifact = {}, {
  config = {},
  strategicBriefFallback = null,
  knownSectionContentFn = knownSectionContent,
  fallbackSectionContentFn = fallbackSectionContent,
  formatDate = (value) => new Date(value).toLocaleString(),
  nowDate = () => new Date().toLocaleString(),
} = {}) {
  const issues = Array.isArray(artifact.selectedIssues) ? artifact.selectedIssues : [];
  const issueClusters = Array.isArray(artifact.selectedIssueClusters) ? artifact.selectedIssueClusters : [];
  const coverageDiagnostics = artifact.coverageDiagnostics || {};
  const sections = (Array.isArray(config.sections) ? config.sections : []).filter((section) => section.enabled !== false);
  const brief = artifact.strategicBrief || (typeof strategicBriefFallback === "function" ? strategicBriefFallback({ artifact, issues, issueClusters, config }) : {}) || {};
  const generatedAt = artifact.generatedAt ? formatDate(artifact.generatedAt) : nowDate();
  const lines = [
    `# ${artifact.title || brief.headline || "Daily Brief"}`,
    `Generated: ${generatedAt}`,
  ];
  const renderContent = (content) => {
    if (Array.isArray(content)) {
      if (!content.length) lines.push("- No read generated.");
      content.forEach((item) => {
        if (typeof item === "string") lines.push(`- ${item}`);
        else if (item?.lens || item?.read) {
          lines.push(`- ${item.lens ? `${item.lens}: ` : ""}${item.read || JSON.stringify(item)}`);
          if (item.implication) lines.push(`  Implication: ${item.implication}`);
        } else {
          lines.push(`- ${JSON.stringify(item)}`);
        }
      });
      return;
    }
    lines.push(String(content || "No read generated."));
  };
  const renderSourceEvidence = (section) => {
    lines.push("", `## ${section.label || "Source Evidence"}`);
    if (!issues.length) {
      lines.push("No selected issues yet. The workflow completed but did not ingest enough source items to compile a brief.");
      return;
    }
    issues.slice(0, 18).forEach((issue, index) => {
      const sources = Array.isArray(issue.corroboratingSources) && issue.corroboratingSources.length ? issue.corroboratingSources.join(", ") : issue.sourceName;
      lines.push(`${index + 1}. ${issue.title} (${sources}${issue.publishedAt ? `, ${formatDate(issue.publishedAt)}` : ""})`);
      if (issue.summary) lines.push(`   ${issue.summary}`);
      if (issue.sectionTags?.length) lines.push(`   Sections: ${issue.sectionTags.join(", ")}`);
      if (issue.evidenceStatus) lines.push(`   Evidence: ${issue.evidenceStatus}${issue.clusterItemCount ? `; ${issue.clusterItemCount} clustered item${issue.clusterItemCount === 1 ? "" : "s"}` : ""}`);
      if (issue.cacheContext?.framing) lines.push(`   Context: ${issue.cacheContext.framing}`);
      if (issue.url) lines.push(`   ${issue.url}`);
    });
  };
  const renderTopIssues = () => {
    const topIssues = Array.isArray(brief.topIssues) && brief.topIssues.length
      ? brief.topIssues
      : issueClusters.slice(0, 18).map((cluster, index) => ({
        rank: index + 1,
        title: cluster.title,
        read: cluster.summary,
        sources: cluster.sourceNames,
        whyItMatters: cluster.sectionTags?.join(", "),
      }));
    lines.push("", "## Top Issues");
    if (!topIssues.length) {
      lines.push("No selected news issue clusters were available. See Coverage Notes for source health.");
      return;
    }
    topIssues.slice(0, 18).forEach((issue, index) => {
      const rank = issue.rank || index + 1;
      const sources = Array.isArray(issue.sources) ? issue.sources.join(", ") : "";
      lines.push(`${rank}. ${issue.title || "Untitled issue"}${sources ? ` (${sources})` : ""}`);
      if (issue.read) lines.push(`   ${issue.read}`);
      if (issue.whyItMatters) lines.push(`   Why it matters: ${issue.whyItMatters}`);
    });
  };
  const renderCoverageNotes = () => {
    const notes = Array.isArray(brief.coverageNotes) && brief.coverageNotes.length
      ? brief.coverageNotes
      : (Array.isArray(coverageDiagnostics.warnings) ? coverageDiagnostics.warnings : []);
    lines.push("", "## Coverage Notes");
    if (!notes.length) {
      lines.push("- No major source coverage degradation reported by the fetch layer.");
      return;
    }
    notes.forEach((note) => lines.push(`- ${typeof note === "string" ? note : JSON.stringify(note)}`));
    const failures = Array.isArray(coverageDiagnostics.topFailures) ? coverageDiagnostics.topFailures.slice(0, 6) : [];
    failures.forEach((failure) => lines.push(`- ${failure.source || failure.type}: ${failure.error || "Fetch failed"}`));
  };
  const renderConfiguredSection = (section) => {
    if (section.key === "sourceEvidence") {
      renderSourceEvidence(section);
      return;
    }
    lines.push("", `## ${section.label || section.key}`);
    const content = brief.sectionResponses?.[section.key]
      ?? knownSectionContentFn(brief, section.key)
      ?? fallbackSectionContentFn(section, issues, config);
    renderContent(content);
  };
  renderTopIssues();
  if (sections.length) {
    sections.forEach(renderConfiguredSection);
  } else {
    [
      { key: "executiveRead", label: "Executive Read" },
      { key: "backgroundContext", label: "Plain-English Context" },
      { key: "whyJackShouldCare", label: config.ownerName && config.ownerName !== "You" ? `Why ${config.ownerName} Should Care` : "Why It Matters" },
      { key: "futureImplications", label: "Future Implications" },
      { key: "doctrineProjectImpact", label: "Doctrine / Project Impact" },
      { key: "councilRead", label: "Analyzer Read" },
      { key: "councilSynthesis", label: "Analyzer Synthesis" },
      { key: "jackPov", label: config.ownerName && config.ownerName !== "You" ? `${config.ownerName} POV` : "POV" },
      { key: "sourceEvidence", label: "Source Evidence" },
      { key: "openQuestions", label: "Open Questions Before Approval" },
    ].forEach(renderConfiguredSection);
  }
  renderCoverageNotes();
  return lines.join("\n");
}
