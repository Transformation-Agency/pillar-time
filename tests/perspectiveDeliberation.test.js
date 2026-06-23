import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizedPerspectiveDeliberation,
  perspectiveDeliberationRequest,
} from "../server/perspectiveDeliberation.js";

const perspectiveLenses = [
  {
    name: "Skeptical Investor",
    role: "Capital allocation",
    description: "Checks whether claims survive diligence.",
    instructions: "Find unsupported upside, risk concentration, and what would change the decision.",
    enabled: true,
  },
  {
    name: "Policy Watcher",
    role: "Regulatory signal",
    description: "Looks for public-sector pressure and compliance exposure.",
    instructions: "Name the policy implication and the next source to check.",
    enabled: true,
  },
];

test("perspective deliberation request preserves lens instructions and caps saved brief context", () => {
  const briefText = `${"A".repeat(18005)} conclusion that should be trimmed`;
  const request = perspectiveDeliberationRequest({ briefText, perspectiveLenses });
  const payload = JSON.parse(request.prompt);

  assert.match(request.system, /saved private intelligence brief/);
  assert.match(request.system, /Do not introduce new factual claims/);
  assert.equal(payload.task, "Run a perspective deliberation over this saved brief.");
  assert.equal(payload.brief.length, 18000);
  assert.equal(payload.brief, "A".repeat(18000));
  assert.deepEqual(payload.perspectiveLenses, perspectiveLenses.map(({ name, role, description, instructions }) => ({
    name,
    role,
    description,
    instructions,
  })));
  assert.deepEqual(Object.keys(payload.perspectiveLenses[0]), ["name", "role", "description", "instructions"]);
  assert.equal(payload.requiredJsonShape.perspectives[0].take, "specific read on the brief");
});

test("perspective deliberation normalization uses lens fallbacks, aliases, limits, and empty-output guardrails", () => {
  const generatedAt = "2026-06-22T10:00:00.000Z";
  const payload = {
    perspectives: [
      { take: "The upside case needs stronger evidence.", nextMove: "Check customer proof." },
      { name: "Policy Watcher", role: "Regulatory", read: "Agency timing is the practical constraint.", implication: "Watch the next filing." },
      { name: "Empty Take", take: "   " },
      ...Array.from({ length: 12 }, (_, index) => ({ name: `Overflow ${index}`, take: `Extra ${index}` })),
    ],
    summary: "Both lenses agree the brief needs one sharper source check.",
  };

  const deliberation = normalizedPerspectiveDeliberation({ payload, perspectiveLenses, generatedAt });

  assert.equal(deliberation.generatedAt, generatedAt);
  assert.equal(deliberation.synthesis, "Both lenses agree the brief needs one sharper source check.");
  assert.equal(deliberation.perspectives.length, 11);
  assert.deepEqual(deliberation.perspectives[0], {
    name: "Skeptical Investor",
    role: "Capital allocation",
    take: "The upside case needs stronger evidence.",
    implication: "Check customer proof.",
  });
  assert.deepEqual(deliberation.perspectives[1], {
    name: "Policy Watcher",
    role: "Regulatory",
    take: "Agency timing is the practical constraint.",
    implication: "Watch the next filing.",
  });
  assert.equal(deliberation.perspectives.at(-1).name, "Overflow 8");

  assert.deepEqual(normalizedPerspectiveDeliberation({
    payload: { perspectives: [], synthesis: "Synthesis-only result." },
    perspectiveLenses,
    generatedAt,
  }), {
    perspectives: [],
    synthesis: "Synthesis-only result.",
    generatedAt,
  });

  assert.throws(() => normalizedPerspectiveDeliberation({
    payload: { perspectives: [{ name: "No take" }], summary: "" },
    perspectiveLenses,
    generatedAt,
  }), /did not return a usable deliberation/);
});
