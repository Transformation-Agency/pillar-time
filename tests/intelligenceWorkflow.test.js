import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCoverageDiagnostics,
  NO_NEWS_FRESHNESS_POLICY,
  noNewsClaimPolicy,
  selectIssueClusters,
} from "../server/intelligenceWorkflow.js";

function cluster(id, sectionTags, score) {
  return { id, sectionTags, score };
}

test("issue cluster selection preserves coverage floors before filling by score", () => {
  const selected = selectIssueClusters([
    cluster("tech-1", ["techAi"], 10),
    cluster("politics-1", ["politicalNational"], 9),
    cluster("markets-1", ["financialMarkets"], 8),
    cluster("politics-2", ["politicalNational"], 7),
    cluster("boulder-1", ["boulderLocal"], 6),
    cluster("markets-2", ["financialMarkets"], 5),
    cluster("colorado-1", ["coloradoRegional"], 4),
    cluster("world-1", ["worldGeopolitics"], 3),
    cluster("science-1", ["scienceHealth"], 2),
  ], 8, 8);

  assert.deepEqual(selected.map((item) => item.id), [
    "tech-1",
    "politics-1",
    "markets-1",
    "politics-2",
    "boulder-1",
    "markets-2",
    "colorado-1",
    "world-1",
  ]);
});

test("issue cluster selection caps output and does not duplicate multi-tag clusters", () => {
  const selected = selectIssueClusters([
    cluster("combined", ["politicalNational", "financialMarkets"], 20),
    cluster("politics-2", ["politicalNational"], 19),
    cluster("markets-2", ["financialMarkets"], 18),
    cluster("boulder-1", ["boulderLocal"], 17),
    cluster("colorado-1", ["coloradoRegional"], 16),
    cluster("world-1", ["worldGeopolitics"], 15),
    cluster("tech-1", ["techAi"], 14),
    cluster("science-1", ["scienceHealth"], 13),
    cluster("extra-1", ["culture"], 12),
    cluster("extra-2", ["culture"], 11),
  ], 4, 6);

  assert.equal(selected.length, 6);
  assert.equal(new Set(selected.map((item) => item.id)).size, selected.length);
  assert.equal(selected.filter((item) => item.id === "combined").length, 1);
});

test("coverage diagnostics report degraded source coverage and candidate filtering", () => {
  const diagnostics = buildCoverageDiagnostics({
    activeSources: [{ id: "x" }, { id: "reddit" }, { id: "rss" }],
    itemCount: 3,
    candidateCount: 0,
    generatedAt: "2026-06-22T16:00:00.000Z",
    sourceResults: {
      xFetches: [{ sourceName: "AI search", ok: false, error: "unsupported operator min_faves" }],
      redditFetches: [{ sourceName: "LocalLLaMA", ok: false, error: "403 forbidden" }],
      rssFetches: [{ sourceName: "AP", ok: true, seen: 4, today: 2, inserted: 2 }],
    },
  });

  assert.equal(diagnostics.generatedAt, "2026-06-22T16:00:00.000Z");
  assert.equal(diagnostics.activeSourceCount, 3);
  assert.equal(diagnostics.byType.rss.succeeded, 1);
  assert.equal(diagnostics.byType.rss.inserted, 2);
  assert.equal(diagnostics.topFailures.length, 2);
  assert.ok(diagnostics.warnings.some((warning) => /unsupported operators/i.test(warning)));
  assert.ok(diagnostics.warnings.some((warning) => /Reddit coverage degraded/i.test(warning)));
  assert.ok(diagnostics.warnings.some((warning) => /no same-day non-calendar news candidates/i.test(warning)));
});

test("no-news policy blocks false quiet claims when coverage degraded or candidates remain", () => {
  const degraded = noNewsClaimPolicy({
    coverageDiagnostics: { warnings: ["X coverage degraded"], topFailures: [] },
    candidateScan: { totalCandidates: 0, selectedClusterCount: 0 },
  });
  assert.equal(degraded.canClaimNoNews, false);
  assert.equal(degraded.hasDegradedCoverage, true);
  assert.equal(degraded.sourceFreshnessPolicy, NO_NEWS_FRESHNESS_POLICY);

  const unselected = noNewsClaimPolicy({
    coverageDiagnostics: { warnings: [], topFailures: [] },
    candidateScan: { totalCandidates: 8, clusterCount: 5, selectedClusterCount: 2 },
  });
  assert.equal(unselected.canClaimNoNews, false);
  assert.equal(unselected.unselectedCandidates, 3);

  const quiet = noNewsClaimPolicy({
    coverageDiagnostics: { warnings: [], topFailures: [] },
    candidateScan: { totalCandidates: 0, selectedClusterCount: 0 },
  });
  assert.equal(quiet.canClaimNoNews, true);
  assert.equal(quiet.warning, "");
});
