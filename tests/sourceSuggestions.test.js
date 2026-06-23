import test from "node:test";
import assert from "node:assert/strict";

import {
  addSelectedSourcesDecision,
  continueAfterAccessDecision,
  skipPrerequisiteSelection,
  sourceCreateRequest,
  sourcePrerequisiteKeys,
  sourcePrerequisites,
  sourceReadyForOnboarding,
} from "../src/sourceSuggestions.js";

const stateWithMissingConnectors = {
  connectors: {
    x: { status: "missing" },
    googleCalendar: { status: "needs consent" },
  },
  runtime: {
    ffmpeg: { available: false },
    stt: { available: false },
  },
  model: {
    provider: "xai",
    status: "missing",
  },
};

test("source suggestions identify blocking prerequisites for gated source types", () => {
  assert.deepEqual(sourcePrerequisiteKeys({ id: "x-1", type: "X" }, stateWithMissingConnectors), ["x"]);
  assert.deepEqual(sourcePrerequisiteKeys({ id: "cal-1", type: "Calendar" }, stateWithMissingConnectors), ["googleCalendar"]);
  assert.deepEqual(sourcePrerequisiteKeys({ id: "pod-1", type: "Podcast", config: {} }, stateWithMissingConnectors), ["ffmpeg", "transcriptionModel"]);
  assert.deepEqual(sourcePrerequisites({ id: "rss-1", type: "RSS" }, stateWithMissingConnectors), []);

  assert.equal(sourceReadyForOnboarding({ id: "rss-1", type: "RSS" }, stateWithMissingConnectors), true);
  assert.equal(sourceReadyForOnboarding({ id: "x-1", type: "X" }, stateWithMissingConnectors), false);
});

test("source suggestions route blocked selected sources through setup instead of saving them", () => {
  const suggestions = [
    { id: "rss-1", type: "RSS", name: "Ready RSS" },
    { id: "x-1", type: "X", name: "Blocked X" },
  ];
  const decision = addSelectedSourcesDecision({
    suggestions,
    selectedIds: new Set(["rss-1", "x-1"]),
    state: stateWithMissingConnectors,
  });

  assert.equal(decision.action, "access");
  assert.equal(decision.message, "1 selected source need setup first.");
  assert.deepEqual(decision.ready.map((source) => source.id), ["rss-1"]);
  assert.deepEqual(decision.blocked.map((source) => source.id), ["x-1"]);
  assert.deepEqual([...decision.pendingIds], ["rss-1", "x-1"]);
});

test("source suggestions save ready selected sources and reject empty selection", () => {
  const suggestions = [
    { id: "rss-1", type: "RSS", name: "Ready RSS" },
    { id: "web-1", type: "Web", name: "Ready Web" },
  ];

  assert.deepEqual(addSelectedSourcesDecision({ suggestions, selectedIds: new Set(), state: {} }), {
    action: "message",
    message: "Select at least one source.",
    chosen: [],
    blocked: [],
    ready: [],
  });

  const decision = addSelectedSourcesDecision({
    suggestions,
    selectedIds: new Set(["rss-1", "web-1"]),
    state: {},
  });
  assert.equal(decision.action, "save");
  assert.deepEqual(decision.ready.map((source) => source.id), ["rss-1", "web-1"]);
});

test("source access continuation saves only after all pending sources are ready", () => {
  const pendingSources = [
    { id: "rss-1", type: "RSS" },
    { id: "x-1", type: "X" },
  ];
  const blocked = continueAfterAccessDecision({ pendingSources, state: stateWithMissingConnectors });
  assert.equal(blocked.action, "message");
  assert.equal(blocked.message, "1 selected source still need setup. Skip those sources or finish setup to continue.");

  const ready = continueAfterAccessDecision({
    pendingSources,
    state: { connectors: { x: { status: "ready" } }, runtime: {}, model: {} },
  });
  assert.equal(ready.action, "save");
  assert.deepEqual(ready.ready.map((source) => source.id), ["rss-1", "x-1"]);
});

test("source suggestion skip and create request helpers preserve selected ready sources", () => {
  const pendingSources = [
    { id: "rss-1", type: "RSS" },
    { id: "x-1", type: "X" },
    { id: "pod-1", type: "Podcast", config: {} },
  ];
  const skipX = skipPrerequisiteSelection({ pendingSources, state: stateWithMissingConnectors, key: "x" });
  assert.deepEqual(skipX.remaining.map((source) => source.id), ["rss-1", "pod-1"]);
  assert.deepEqual([...skipX.nextIds], ["rss-1", "pod-1"]);
  assert.equal(skipX.message, "Skipped X sources.");
  assert.equal(skipX.returnToSources, false);

  const skipTranscription = skipPrerequisiteSelection({ pendingSources: [{ id: "pod-1", type: "Podcast", config: {} }], state: stateWithMissingConnectors, key: "transcription" });
  assert.deepEqual(skipTranscription.remaining, []);
  assert.equal(skipTranscription.returnToSources, true);

  assert.deepEqual(sourceCreateRequest({ id: "rss-1", type: "RSS", config: { mode: "feed" } }), {
    url: "/api/sources",
    method: "POST",
    body: { id: "rss-1", type: "RSS", config: { mode: "feed" } },
  });
});
