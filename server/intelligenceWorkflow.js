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
