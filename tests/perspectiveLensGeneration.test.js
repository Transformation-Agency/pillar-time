import test from "node:test";
import assert from "node:assert/strict";

import {
  generatedPerspectiveLensDrafts,
  perspectiveLensGenerationPrompt,
  requestedPerspectiveLensLimit,
} from "../server/perspectiveLensGeneration.js";
import {
  appendPerspectiveTranscript,
  perspectiveGenerationFailure,
  perspectiveGenerationRequest,
  perspectiveGenerationSuccess,
  perspectiveVoiceFailure,
} from "../src/perspectiveLensGeneration.js";

test("perspective lens generation infers conservative lens counts from prompt", () => {
  assert.equal(requestedPerspectiveLensLimit("Give me a skeptical investor lens"), 1);
  assert.equal(requestedPerspectiveLensLimit("Create one perspective for policy risk"), 1);
  assert.equal(requestedPerspectiveLensLimit("Create 3 perspectives"), 3);
  assert.equal(requestedPerspectiveLensLimit("Give me four different perspectives"), 4);
  assert.equal(requestedPerspectiveLensLimit("Give me several lenses"), 4);
});

test("perspective lens generation prompt asks model for the inferred draft count", () => {
  const request = perspectiveLensGenerationPrompt("Create two lenses for market and policy risk");
  const payload = JSON.parse(request.prompt);

  assert.equal(request.lensLimit, 2);
  assert.match(request.system, /editable perspective lenses/);
  assert.equal(payload.request, "Create two lenses for market and policy risk");
  assert.match(payload.task, /Generate exactly 2 perspective lenses/);
  assert.equal(payload.requiredJsonShape.lenses[0].enabled, true);
});

test("perspective lens draft normalization injects ids, sanitizes, limits, and rejects empty model output", () => {
  const sanitizeLenses = (items) => items
    .filter((item) => item.name && item.instructions)
    .map((item) => ({ ...item, enabled: item.enabled !== false }));
  const createId = (prefix) => `${prefix}-id`;

  const drafts = generatedPerspectiveLensDrafts({
    modelText: JSON.stringify({
      lenses: [
        { name: "Investor", instructions: "Watch incentives." },
        { id: "custom-id", name: "Policy", instructions: "Watch regulation." },
        { name: "", instructions: "Drop me." },
      ],
    }),
    lensLimit: 2,
    parseJson: JSON.parse,
    sanitizeLenses,
    createId,
  });

  assert.deepEqual(drafts.map((lens) => lens.id), ["perspective-1-id", "custom-id"]);
  assert.deepEqual(drafts.map((lens) => lens.name), ["Investor", "Policy"]);
  assert.equal(drafts[0].enabled, true);

  assert.throws(() => generatedPerspectiveLensDrafts({
    modelText: JSON.stringify({ lenses: [] }),
    lensLimit: 1,
    parseJson: JSON.parse,
    sanitizeLenses,
    createId,
  }), /did not return usable perspective lenses/);
});

test("frontend perspective generation helpers preserve request, drafts, and failure messages", () => {
  assert.deepEqual(perspectiveGenerationRequest("skeptical operator"), {
    url: "/api/perspective-lenses/generate",
    method: "POST",
    body: { prompt: "skeptical operator" },
  });

  const generated = perspectiveGenerationSuccess([{ id: "lens-1" }, { id: "lens-2" }]);
  assert.deepEqual(generated.drafts, [{ id: "lens-1" }, { id: "lens-2" }]);
  assert.equal(generated.message, "Generated 2 perspective lenses.");
  assert.equal(perspectiveGenerationSuccess([{ id: "lens-1" }]).message, "Generated 1 perspective lens.");
  assert.equal(perspectiveGenerationFailure(new Error("Model offline")), "Model offline");
  assert.equal(perspectiveGenerationFailure({}), "Could not generate perspective lenses.");
});

test("voice transcript helpers append text and keep actionable fallback messages", () => {
  assert.deepEqual(appendPerspectiveTranscript("skeptical investor", "policy watcher"), {
    prompt: "skeptical investor policy watcher",
    message: "Voice input added.",
    added: true,
  });
  assert.deepEqual(appendPerspectiveTranscript("", "  "), {
    prompt: "",
    message: "Transcription returned no text. You can try again or type the request.",
    added: false,
  });
  assert.equal(perspectiveVoiceFailure(new Error("STT unavailable")), "STT unavailable");
  assert.equal(perspectiveVoiceFailure({}), "Voice input stopped. You can keep typing instead.");
});
