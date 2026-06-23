import test from "node:test";
import assert from "node:assert/strict";

import {
  morningBriefPlanningContext,
  recommendationCandidates,
  whatShouldIDoNow,
  wipAssessment,
} from "../src/nowRecommendation.js";

const baseState = {
  workflowRuns: [{
    id: "run-brief",
    runType: "executive_day",
    status: "completed",
    completedAt: "2026-06-22T14:00:00.000Z",
    artifact: {
      title: "Morning operating brief",
      renderedBrief: "Investor update is the highest leverage item today. Do not reorganize the backlog until investor confidence is handled.",
      todaysThree: [{ title: "Investor update" }],
      highestLeverageRead: ["Draft the investor update KPI paragraphs."],
      missingInfo: ["Current revenue number"],
      approvalItems: [{ id: "approval-1", kind: "calendar_schedule" }],
      risks: [{ type: "deadline", title: "Investor update due today" }],
    },
  }],
  time: {
    suggestions: [
      {
        id: "investor",
        feedbackKey: "investor",
        title: "Draft investor update KPI paragraphs",
        reason: "Moves fundraising confidence and was flagged by the morning brief.",
        leverageCategory: "launchRevenue",
        source: "task",
        estimateMinutes: 45,
        confidence: 0.82,
      },
      {
        id: "backlog",
        feedbackKey: "backlog",
        title: "Reorganize Linear backlog",
        reason: "Useful maintenance but not the constraint.",
        leverageCategory: "admin",
        source: "task",
        estimateMinutes: 120,
        confidence: 0.62,
      },
      {
        id: "blocked",
        feedbackKey: "blocked",
        title: "Send partner proposal",
        reason: "Waiting on pricing input.",
        leverageCategory: "unblock",
        source: "task",
        status: "blocked",
        estimateMinutes: 30,
      },
    ],
    commitments: [{ id: "daily-1", title: "Investor update", status: "active", notes: "Today commitment" }],
    canonicalCommitments: [],
    tasks: [],
    suggestionFeedback: [],
  },
};

test("morning brief planning context exposes operating-plan inputs", () => {
  const context = morningBriefPlanningContext(baseState);

  assert.equal(context.available, true);
  assert.equal(context.runId, "run-brief");
  assert.equal(context.title, "Morning operating brief");
  assert.ok(context.recommendations.some((item) => /Investor update/.test(item)));
  assert.deepEqual(context.missingInformation, ["Current revenue number"]);
  assert.equal(context.approvalItems[0].kind, "calendar_schedule");
  assert.equal(context.risks[0].type, "deadline");
});

test("recommendation candidates keep commitments distinct from tasks and suggestions", () => {
  const candidates = recommendationCandidates(baseState);

  assert.ok(candidates.some((item) => item.source === "commitment" && item.title === "Investor update"));
  assert.ok(candidates.some((item) => item.source === "task" && item.title === "Draft investor update KPI paragraphs"));
});

test("what should I do now favors objective aligned morning-brief work that fits the window", () => {
  const result = whatShouldIDoNow(baseState, {
    windowMinutes: 60,
    energyState: "clear",
    nowDate: new Date("2026-06-22T15:00:00.000Z"),
  });

  assert.match(result.primary.title, /investor update/i);
  assert.match(result.nextAction, /Investor update|investor update/);
  assert.equal(result.morningBrief.available, true);
  assert.equal(result.authorityBoundary.label, "Contact Lens boundary");
  assert.equal(result.primary.authority.canExecute, false);
  assert.ok(result.primary.scoreBreakdown.some((factor) => factor.key === "morningBrief" && factor.score > 0));
  assert.ok(result.primary.scoreBreakdown.some((factor) => factor.key === "timeFit" && factor.score > 0));
  assert.ok(result.primary.scoreBreakdown.some((factor) => factor.key === "energyFit" && factor.score > 0));
  assert.equal(result.auditPreview.selectedPrimaryId, result.primary.id);
});

test("blocked items are penalized and can become the avoid-for-now item", () => {
  const result = whatShouldIDoNow(baseState, {
    windowMinutes: 30,
    energyState: "social",
    nowDate: new Date("2026-06-22T15:00:00.000Z"),
  });

  assert.notEqual(result.primary.feedbackKey, "blocked");
  assert.equal(result.avoid.feedbackKey, "blocked");
  assert.ok(result.avoid.scoreBreakdown.some((factor) => factor.key === "risk" && factor.score < 0));
});

test("feedback and WIP pressure change recommendation confidence and warnings", () => {
  const overloaded = {
    ...baseState,
    time: {
      ...baseState.time,
      commitments: Array.from({ length: 6 }, (_, index) => ({ id: `c-${index}`, title: `Commitment ${index}`, status: "active" })),
      canonicalCommitments: Array.from({ length: 6 }, (_, index) => ({ id: `cc-${index}`, title: `Canonical ${index}`, status: "active" })),
      suggestionFeedback: [{ key: "investor", feedback: "never" }],
    },
  };

  const wip = wipAssessment(overloaded);
  assert.equal(wip.overloaded, true);
  assert.ok(wip.warnings.some((warning) => /Today/.test(warning)));

  const result = whatShouldIDoNow(overloaded, {
    windowMinutes: 60,
    energyState: "clear",
    nowDate: new Date("2026-06-22T15:00:00.000Z"),
  });

  assert.equal(result.wip.overloaded, true);
  assert.ok(result.ranked.find((item) => item.feedbackKey === "investor").scoreBreakdown.some((factor) => factor.key === "feedback" && factor.score < 0));
});
