import test from "node:test";
import assert from "node:assert/strict";

import { constitutionUpdatePlan } from "../server/constitutionVersioning.js";
import { trustedContextConstitutionView } from "../src/trustedContextConstitution.js";

test("trusted context constitution view renders current version and body", () => {
  const view = trustedContextConstitutionView({
    constitution: {
      version: 7,
      body: {
        immutableRules: ["Keep live data separate from stable context."],
        workspaceRules: ["Disclose stale source coverage."],
      },
    },
  });

  assert.equal(view.versionLabel, "Version 7");
  assert.equal(view.bodyText, JSON.stringify({
    immutableRules: ["Keep live data separate from stable context."],
    workspaceRules: ["Disclose stale source coverage."],
  }, null, 2));
});

test("constitution update plan versions a new body and prepares audit metadata", () => {
  const current = {
    version: 3,
    body: { immutableRules: ["old"], workspaceRules: [] },
  };
  const input = {
    body: { immutableRules: ["new"], workspaceRules: ["workspace"] },
    editor: "  paul  ",
    reason: "  Tighten workspace rules  ",
  };

  const plan = constitutionUpdatePlan({
    current,
    input,
    now: new Date("2026-06-22T12:00:00.000Z"),
    idFactory: () => "ctx-constitution-test",
  });

  assert.deepEqual(plan.row, {
    id: "ctx-constitution-test",
    version: 4,
    body: { immutableRules: ["new"], workspaceRules: ["workspace"] },
    editor: "paul",
    reason: "Tighten workspace rules",
    createdAt: "2026-06-22T12:00:00.000Z",
  });
  assert.deepEqual(plan.audit, {
    action: "trusted_context.constitution_updated",
    entityType: "context_constitution",
    entityId: "ctx-constitution-test",
    note: "Tighten workspace rules",
    diff: { fromVersion: 3, toVersion: 4 },
    actor: "paul",
  });
});

test("constitution update plan defaults to current body and local actor", () => {
  const current = {
    version: 0,
    body: { immutableRules: ["stable"], workspaceRules: ["workspace"] },
  };

  const plan = constitutionUpdatePlan({
    current,
    input: { body: "not an object", editor: "   ", reason: "" },
    now: "2026-06-22T12:00:00.000Z",
    idFactory: () => "ctx-default",
  });

  assert.equal(plan.row.version, 1);
  assert.deepEqual(plan.row.body, current.body);
  assert.equal(plan.row.editor, "local-user");
  assert.equal(plan.row.reason, "Updated Trusted Context constitution");
  assert.deepEqual(plan.audit.diff, { fromVersion: 0, toVersion: 1 });
});
