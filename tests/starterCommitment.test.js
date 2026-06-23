import test from "node:test";
import assert from "node:assert/strict";

import {
  starterCommitmentMessageTone,
  starterCommitmentMessages,
  starterCommitmentRank,
  starterCommitmentRequests,
  submitStarterCommitmentFlow,
} from "../src/starterCommitment.js";

test("starter commitment blocks blank onboarding submissions", async () => {
  const calls = [];
  const result = await submitStarterCommitmentFlow({
    value: "   ",
    api: async () => calls.push("api"),
    refresh: async () => calls.push("refresh"),
  });

  assert.deepEqual(result, {
    ok: false,
    clearInput: false,
    message: starterCommitmentMessages.blank,
  });
  assert.deepEqual(calls, []);
});

test("starter commitment creates planner task and daily commitment before refreshing", async () => {
  const calls = [];
  const result = await submitStarterCommitmentFlow({
    value: "  Prepare week-one checkpoint  ",
    existingCommitments: [{ id: "commitment_1" }],
    api: async (url, options) => calls.push(["api", url, options.method, JSON.parse(options.body)]),
    refresh: async () => calls.push(["refresh"]),
  });

  assert.deepEqual(result, {
    ok: true,
    clearInput: true,
    message: starterCommitmentMessages.success,
    title: "Prepare week-one checkpoint",
  });
  assert.deepEqual(calls, [
    ["api", "/api/time/tasks", "POST", {
      title: "Prepare week-one checkpoint",
      source: "onboarding",
      leverageCategory: "deepWork",
      priority: "high",
    }],
    ["api", "/api/time/commitments", "POST", {
      title: "Prepare week-one checkpoint",
      notes: "Added during onboarding.",
      rank: 2,
    }],
    ["refresh"],
  ]);
});

test("starter commitment rank caps Today’s Three at third position", () => {
  assert.equal(starterCommitmentRank([]), 1);
  assert.equal(starterCommitmentRank([{ id: 1 }, { id: 2 }]), 3);
  assert.equal(starterCommitmentRank([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]), 3);

  const built = starterCommitmentRequests("Ship one useful thing", [{}, {}, {}, {}]);
  assert.equal(built.requests[1].body.rank, 3);
});

test("starter commitment keeps input and skips refresh when persistence fails", async () => {
  const calls = [];
  const result = await submitStarterCommitmentFlow({
    value: "Draft client memo",
    api: async (url) => {
      calls.push(url);
      if (url === "/api/time/commitments") throw new Error("Commitment title is required.");
    },
    refresh: async () => calls.push("refresh"),
  });

  assert.deepEqual(result, {
    ok: false,
    clearInput: false,
    message: "Commitment title is required.",
  });
  assert.deepEqual(calls, ["/api/time/tasks", "/api/time/commitments"]);
});

test("starter commitment message tone distinguishes success from warnings", () => {
  assert.equal(starterCommitmentMessageTone(starterCommitmentMessages.success), "ok-text");
  assert.equal(starterCommitmentMessageTone(starterCommitmentMessages.blank), "warn-text");
  assert.equal(starterCommitmentMessageTone("Could not add commitment."), "warn-text");
});
