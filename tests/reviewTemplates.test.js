import test from "node:test";
import assert from "node:assert/strict";

import {
  reviewMessageTone,
  reviewToggleRequest,
  reviewToggleSuccessMessage,
  toggleReviewTemplateFlow,
} from "../src/reviewTemplates.js";

test("onboarding review toggle builds enable and disable requests", () => {
  assert.deepEqual(reviewToggleRequest({ id: "morning", enabled: false }), {
    url: "/api/time/reviews/morning",
    method: "PATCH",
    body: { enabled: true },
  });

  assert.deepEqual(reviewToggleRequest({ id: "weekly", enabled: true }), {
    url: "/api/time/reviews/weekly",
    method: "PATCH",
    body: { enabled: false },
  });
});

test("onboarding review toggle payload only changes template enabled state", () => {
  const request = reviewToggleRequest({
    id: "monthly",
    title: "Monthly Review",
    enabled: false,
    cadence: "monthly",
    localTime: "09:00",
  });

  assert.deepEqual(Object.keys(request.body), ["enabled"]);
  assert.equal(Object.hasOwn(request.body, "scheduleType"), false);
  assert.equal(Object.hasOwn(request.body, "nextOccurrence"), false);
  assert.equal(Object.hasOwn(request.body, "channels"), false);
});

test("onboarding review toggle flow saves through review template route and confirms state", async () => {
  const calls = [];
  const result = await toggleReviewTemplateFlow({
    review: { id: "quarterly", title: "Quarterly Review", enabled: false },
    mutate: async (url, body, method) => calls.push([url, body, method]),
  });

  assert.deepEqual(result, {
    ok: true,
    message: "Quarterly Review enabled.",
  });
  assert.deepEqual(calls, [[
    "/api/time/reviews/quarterly",
    { enabled: true },
    "PATCH",
  ]]);
});

test("onboarding review toggle validates id and reports persistence failures", async () => {
  assert.throws(() => reviewToggleRequest({ enabled: true }), /Review template id is required/);

  const result = await toggleReviewTemplateFlow({
    review: { id: "morning", title: "Morning Review", enabled: true },
    mutate: async () => {
      throw new Error("Review template not found");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    message: "Review template not found",
  });
});

test("onboarding review messages render success and warning tones", () => {
  assert.equal(reviewToggleSuccessMessage({ title: "Weekly Review", enabled: true }), "Weekly Review disabled.");
  assert.equal(reviewToggleSuccessMessage({ title: "Weekly Review", enabled: false }), "Weekly Review enabled.");
  assert.equal(reviewMessageTone("Weekly Review enabled."), "ok-text");
  assert.equal(reviewMessageTone("Could not update review."), "warn-text");
});
