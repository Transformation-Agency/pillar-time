import test from "node:test";
import assert from "node:assert/strict";

import {
  PERSPECTIVE_LENS_SAVED_MESSAGE,
  PERSPECTIVE_LENS_UNSAVED_MESSAGE,
  activePerspectiveLensCount,
  addPerspectiveLens,
  editPerspectiveLenses,
  filterPerspectiveLenses,
  newPerspectiveLens,
  perspectiveLensMessageTone,
  perspectiveLensSaveRequest,
  removePerspectiveLens,
  savePerspectiveLensesFlow,
  updatePerspectiveLens,
} from "../src/perspectiveLenses.js";

const savedLenses = [
  {
    id: "skeptic",
    name: "Skeptical Investor",
    role: "Investor",
    description: "Checks whether claims survive diligence.",
    instructions: "Find risk.",
    enabled: true,
  },
  {
    id: "policy",
    name: "Policy Watcher",
    role: "Regulator",
    description: "Tracks policy implications.",
    instructions: "Find policy pressure.",
    enabled: false,
  },
];

test("perspective lens edits stay local and mark unsaved until save", () => {
  const edited = editPerspectiveLenses(savedLenses, (current) => updatePerspectiveLens(current, 0, { role: "Board" }));

  assert.equal(edited.dirty, true);
  assert.equal(edited.message, PERSPECTIVE_LENS_UNSAVED_MESSAGE);
  assert.equal(edited.lenses[0].role, "Board");
  assert.equal(savedLenses[0].role, "Investor");
});

test("perspective lens add remove and filter helpers preserve expected lens fields", () => {
  const lens = newPerspectiveLens(1234);
  const added = addPerspectiveLens(savedLenses, lens);
  const removed = removePerspectiveLens(added, 1);

  assert.equal(lens.id, "perspective-1234");
  assert.equal(lens.enabled, true);
  assert.equal(added.length, 3);
  assert.deepEqual(removed.map((item) => item.id), ["skeptic", "perspective-1234"]);
  assert.deepEqual(filterPerspectiveLenses(added, "policy").map((item) => item.id), ["policy"]);
  assert.deepEqual(filterPerspectiveLenses(added, "  investor  ").map((item) => item.id), ["skeptic"]);
});

test("perspective lens save request persists lenses through brief config patch", async () => {
  const currentConfig = {
    productName: "Pillar Time",
    deliveryTime: "08:00",
    perspectiveLenses: [{ id: "old", enabled: true }],
  };
  const request = perspectiveLensSaveRequest(currentConfig, savedLenses);

  assert.deepEqual(request, {
    url: "/api/brief-config",
    method: "PATCH",
    body: {
      productName: "Pillar Time",
      deliveryTime: "08:00",
      perspectiveLenses: savedLenses,
    },
  });

  const calls = [];
  const result = await savePerspectiveLensesFlow({
    currentConfig,
    lenses: savedLenses,
    mutate: async (url, body, method) => calls.push([url, body, method]),
  });

  assert.deepEqual(result, { ok: true, dirty: false, message: PERSPECTIVE_LENS_SAVED_MESSAGE });
  assert.deepEqual(calls, [[
    "/api/brief-config",
    {
      productName: "Pillar Time",
      deliveryTime: "08:00",
      perspectiveLenses: savedLenses,
    },
    "PATCH",
  ]]);
});

test("perspective lens count and messages reflect saved enabled lenses", async () => {
  assert.equal(activePerspectiveLensCount(savedLenses), 1);
  assert.equal(activePerspectiveLensCount([...savedLenses, { id: "default-enabled" }]), 2);

  assert.equal(perspectiveLensMessageTone(PERSPECTIVE_LENS_SAVED_MESSAGE), "ok-text");
  assert.equal(perspectiveLensMessageTone(PERSPECTIVE_LENS_UNSAVED_MESSAGE), "hint");
  assert.equal(perspectiveLensMessageTone("database locked"), "warn-text");

  const result = await savePerspectiveLensesFlow({
    lenses: savedLenses,
    mutate: async () => {
      throw new Error("database locked");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    dirty: true,
    message: "database locked",
  });
});
