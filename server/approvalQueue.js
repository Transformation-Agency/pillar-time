export function approvalView(row = {}, parsePayload = JSON.parse) {
  const parse = typeof parsePayload === "function" ? parsePayload : JSON.parse;
  let payload = {};
  try {
    payload = typeof row.payload_json === "string" ? parse(row.payload_json || "{}") : (row.payload_json || row.payload || {});
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    risk: row.risk,
    status: row.status,
    runId: row.run_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload,
    createdAt: row.created_at,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note,
  };
}

export function approvalStatusUpdate({ id, status, by = "operator", note = "", resolvedAt }) {
  if (!id) throw new Error("Approval id is required.");
  if (!["approved", "rejected"].includes(status)) throw new Error("Invalid status");
  return {
    id,
    status,
    resolvedBy: by || "operator",
    resolvedAt,
    resolutionNote: note || "",
    auditAction: `approval.${status}`,
    auditNote: note || status,
  };
}

export function nextPendingApproval(rows = [], requestedApprovalId = "") {
  const pending = rows.filter((row) => row?.status === "pending");
  if (requestedApprovalId) return pending.find((row) => row.id === requestedApprovalId) || null;
  return [...pending].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))[0] || null;
}
