import test from "node:test";
import assert from "node:assert/strict";

import { approvalStatusUpdate, approvalView, nextPendingApproval } from "../server/approvalQueue.js";

test("approvalView serializes database rows into queue items and tolerates bad payload JSON", () => {
  assert.deepEqual(approvalView({
    id: "approval-1",
    title: "Review action",
    kind: "linear_action",
    risk: "low",
    status: "pending",
    run_id: "run-1",
    entity_type: "linear_issue",
    entity_id: "issue-1",
    payload_json: "{\"operation\":\"addComment\",\"issueId\":\"issue-1\"}",
    created_at: "2026-06-22T10:00:00.000Z",
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
  }), {
    id: "approval-1",
    title: "Review action",
    kind: "linear_action",
    risk: "low",
    status: "pending",
    runId: "run-1",
    entityType: "linear_issue",
    entityId: "issue-1",
    payload: { operation: "addComment", issueId: "issue-1" },
    createdAt: "2026-06-22T10:00:00.000Z",
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
  });

  assert.deepEqual(approvalView({ id: "approval-2", payload_json: "{" }).payload, {});
});

test("approvalStatusUpdate only allows approve or reject and captures audit metadata", () => {
  assert.deepEqual(approvalStatusUpdate({
    id: "approval-1",
    status: "approved",
    by: "operator",
    note: "Looks right.",
    resolvedAt: "2026-06-22T10:01:00.000Z",
  }), {
    id: "approval-1",
    status: "approved",
    resolvedBy: "operator",
    resolvedAt: "2026-06-22T10:01:00.000Z",
    resolutionNote: "Looks right.",
    auditAction: "approval.approved",
    auditNote: "Looks right.",
  });

  assert.deepEqual(approvalStatusUpdate({
    id: "approval-2",
    status: "rejected",
    by: "",
  }), {
    id: "approval-2",
    status: "rejected",
    resolvedBy: "operator",
    resolvedAt: undefined,
    resolutionNote: "",
    auditAction: "approval.rejected",
    auditNote: "rejected",
  });

  assert.throws(() => approvalStatusUpdate({ id: "approval-3", status: "executed" }), /Invalid status/);
  assert.throws(() => approvalStatusUpdate({ status: "approved" }), /Approval id is required/);
});

test("nextPendingApproval selects requested pending item or oldest pending item", () => {
  const rows = [
    { id: "executed", status: "executed", created_at: "2026-06-22T09:00:00.000Z" },
    { id: "newer", status: "pending", created_at: "2026-06-22T11:00:00.000Z" },
    { id: "older", status: "pending", created_at: "2026-06-22T10:00:00.000Z" },
  ];

  assert.equal(nextPendingApproval(rows)?.id, "older");
  assert.equal(nextPendingApproval(rows, "newer")?.id, "newer");
  assert.equal(nextPendingApproval(rows, "executed"), null);
  assert.equal(nextPendingApproval(rows, "missing"), null);
});
