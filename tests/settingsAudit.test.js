import test from "node:test";
import assert from "node:assert/strict";

import {
  auditDisplayText,
  auditEntityLabel,
  auditLogRows,
  auditTimestampLabel,
  settingsAuditVisibility,
} from "../src/settingsAudit.js";

const formatIso = (date) => date.toISOString();

test("settings audit visibility shapes loaded rows for the Settings panel", () => {
  const view = settingsAuditVisibility({
    auditLogs: [
      {
        id: "audit_1",
        ts: "2026-06-22T15:20:00.000Z",
        actor: "system",
        action: "telegram.delivered",
        entityType: "workflow_run",
        entityId: "run_1",
        note: "Delivered brief to chat 42",
      },
      {
        id: "audit_2",
        ts: "2026-06-22T15:10:00.000Z",
        actor: "operator",
        action: "model.settings_updated",
        entityType: "model_settings",
        entityId: "1",
        note: "Model connector enabled/updated",
      },
    ],
    limit: 1,
    formatter: formatIso,
  });

  assert.equal(view.status, "ready");
  assert.equal(view.count, 2);
  assert.equal(view.countLabel, "2 entries");
  assert.deepEqual(view.rows, [
    {
      id: "audit_1",
      time: "2026-06-22T15:20:00.000Z",
      actor: "system",
      action: "telegram.delivered",
      entity: "workflow_run:run_1",
      note: "Delivered brief to chat 42",
    },
  ]);
});

test("settings audit visibility covers empty, loading, and error states", () => {
  const empty = settingsAuditVisibility({ auditLogs: [] });
  assert.equal(empty.status, "empty");
  assert.equal(empty.countLabel, "0 entries");
  assert.equal(empty.emptyState.title, "No audit entries");

  const loading = settingsAuditVisibility({ loading: true, auditLogs: [{ id: "hidden" }] });
  assert.equal(loading.status, "loading");
  assert.equal(loading.countLabel, "Loading");
  assert.equal(loading.rows.length, 0);
  assert.equal(loading.emptyState.title, "Loading audit log");

  const error = settingsAuditVisibility({ error: "Database unavailable" });
  assert.equal(error.status, "error");
  assert.equal(error.countLabel, "Unavailable");
  assert.equal(error.emptyState.title, "Audit log unavailable");
  assert.equal(error.emptyState.body, "Database unavailable");
});

test("settings audit helpers safely display malformed audit metadata", () => {
  assert.equal(auditDisplayText({ token: "secret" }, "unknown"), "unknown");
  assert.equal(auditDisplayText(["array"], "unknown"), "unknown");
  assert.equal(auditDisplayText("", "unknown"), "unknown");
  assert.equal(auditTimestampLabel("not-a-date", formatIso), "Unknown time");
  assert.equal(auditEntityLabel({ entityType: null, entityId: { nested: true } }), "unknown:unknown");

  const longNote = "x".repeat(300);
  const [row] = auditLogRows([
    {
      id: null,
      ts: "invalid",
      actor: { name: "operator" },
      action: "",
      entityType: "connector",
      entityId: undefined,
      note: longNote,
    },
  ], { formatter: formatIso });

  assert.equal(row.id, "audit-0");
  assert.equal(row.time, "Unknown time");
  assert.equal(row.actor, "unknown");
  assert.equal(row.action, "unknown.action");
  assert.equal(row.entity, "connector:unknown");
  assert.equal(row.note.length, 240);
  assert.equal(row.note.endsWith("…"), true);
});
