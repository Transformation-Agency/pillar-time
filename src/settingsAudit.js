const DEFAULT_LIMIT = 12;
const TEXT_LIMIT = 240;

export const auditLogEmptyState = {
  icon: "audit",
  title: "No audit entries",
  body: "The first state-changing action will create the first audit log.",
};

export const auditLogLoadingState = {
  icon: "audit",
  title: "Loading audit log",
  body: "Fetching the latest state-changing actions.",
};

export const auditLogErrorState = {
  icon: "audit",
  title: "Audit log unavailable",
  body: "Settings could not load the audit log right now.",
};

export function auditDisplayText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object" || typeof value === "function" || typeof value === "symbol") return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT - 1)}…` : text;
}

export function auditTimestampLabel(value, formatter = defaultAuditTimestampFormatter) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return formatter(date);
}

export function auditEntityLabel(entry = {}) {
  const type = auditDisplayText(entry.entityType, "unknown");
  const id = auditDisplayText(entry.entityId, "unknown");
  return `${type}:${id}`;
}

export function auditLogRows(logs = [], { limit, formatter } = {}) {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const capped = Number.isInteger(limit) && limit >= 0 ? safeLogs.slice(0, limit) : safeLogs;
  return capped.map((entry = {}, index) => ({
    id: auditDisplayText(entry.id, `audit-${index}`),
    time: auditTimestampLabel(entry.ts, formatter),
    actor: auditDisplayText(entry.actor, "unknown"),
    action: auditDisplayText(entry.action, "unknown.action"),
    entity: auditEntityLabel(entry),
    note: auditDisplayText(entry.note, ""),
  }));
}

export function settingsAuditVisibility({ auditLogs, loading = false, error = "", limit = DEFAULT_LIMIT, formatter } = {}) {
  if (loading) {
    return {
      status: "loading",
      rows: [],
      count: 0,
      countLabel: "Loading",
      emptyState: auditLogLoadingState,
    };
  }
  if (error) {
    return {
      status: "error",
      rows: [],
      count: 0,
      countLabel: "Unavailable",
      emptyState: { ...auditLogErrorState, body: auditDisplayText(error, auditLogErrorState.body) },
    };
  }
  const safeLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const rows = auditLogRows(safeLogs, { limit, formatter });
  return {
    status: rows.length ? "ready" : "empty",
    rows,
    count: safeLogs.length,
    countLabel: `${safeLogs.length} ${safeLogs.length === 1 ? "entry" : "entries"}`,
    emptyState: auditLogEmptyState,
  };
}

function defaultAuditTimestampFormatter(date) {
  return date.toLocaleString();
}
