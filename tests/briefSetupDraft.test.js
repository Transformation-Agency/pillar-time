import test from "node:test";
import assert from "node:assert/strict";

import {
  briefSetupApplyFallbackRequests,
  briefSetupApplyRequest,
  briefSetupDraftMessage,
  briefSetupDraftRequest,
  localBriefSetupDraft,
  localBriefSetupDraftMessage,
  shouldUseLocalBriefSetupFallback,
} from "../src/briefSetupDraft.js";

test("brief setup local draft preserves owner, preferences, topics, and calendar section", () => {
  const draft = localBriefSetupDraft(
    "I mainly want AI, markets, X and Reddit sentiment, and a conservative frame without fake certainty.",
    {
      ownerName: "Avery",
      productName: "Pillar Time",
      calendarConnected: true,
    },
  );

  assert.equal(draft.ownerName, "Avery");
  assert.match(draft.audienceContext, /AI/);
  assert.match(draft.audienceContext, /markets/);
  assert.match(draft.audienceContext, /X sentiment/);
  assert.match(draft.audienceContext, /Reddit sentiment/);
  assert.match(draft.audienceContext, /preserve the right-leaning\/conservative frame/);
  assert.equal(draft.sections[0].key, "calendarAgenda");
  assert.ok(draft.sections.some((section) => section.key === "sourceEvidence"));
});

test("brief setup draft request and messages target onboarding draft endpoint", () => {
  assert.deepEqual(briefSetupDraftRequest({ briefPrompt: "Daily plan", ownerName: "Avery" }), {
    url: "/api/onboarding/brief-setup-draft",
    method: "POST",
    body: {
      briefPrompt: "Daily plan",
      ownerName: "Avery",
    },
  });

  const draft = { sections: [{ key: "a" }, { key: "b" }] };
  assert.equal(briefSetupDraftMessage(draft, false), "Drafted 2 brief sections. Review and apply them.");
  assert.equal(briefSetupDraftMessage(draft, true), "Built a starter setup because the model draft was incomplete. Review and apply 2 sections.");
  assert.equal(localBriefSetupDraftMessage(draft), "Built a starter setup locally. Review and apply 2 sections.");
});

test("brief setup falls back locally for route and model/provider failures", () => {
  assert.equal(shouldUseLocalBriefSetupFallback(new Error("404 Not Found")), true);
  assert.equal(shouldUseLocalBriefSetupFallback(new Error("Set up a working model API key before generating a brief setup draft.")), true);
  assert.equal(shouldUseLocalBriefSetupFallback(new Error("provider timeout")), true);
  assert.equal(shouldUseLocalBriefSetupFallback(new Error("Validation failed: prompt too short")), false);
});

test("brief setup apply uses canonical endpoint and compatible fallback writes", () => {
  const draft = {
    ownerName: "Avery",
    productName: "Pillar Time",
    audienceContext: "Private daily brief",
    voiceRules: "Direct",
    sections: [{ key: "executiveRead", label: "Executive Read" }],
  };

  assert.deepEqual(briefSetupApplyRequest(draft), {
    url: "/api/onboarding/brief-setup-apply",
    method: "POST",
    body: { draft },
  });

  assert.deepEqual(briefSetupApplyFallbackRequests({
    draft,
    briefPrompt: "Focus on markets and commitments.",
    sourceSuggestions: [{ id: "source-1" }],
  }), [
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
        briefPrompt: "Focus on markets and commitments.",
        sourceSuggestions: [{ id: "source-1" }],
        briefConfigDraft: draft,
      },
    },
  ]);
});
