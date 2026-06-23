export function parseTelegramCommand(input = "") {
  const raw = String(input || "").trim().replace(/\s+/g, " ");
  const [name = "", ...args] = raw ? raw.split(" ") : [""];
  return {
    raw,
    command: name.toLowerCase(),
    args,
    requestedId: args[0] || "",
  };
}

export function selectTelegramPendingApproval(rows = [], requestedApprovalId = "") {
  const pending = rows.filter((row) => row?.status === "pending");
  if (requestedApprovalId) return pending.find((row) => row.id === requestedApprovalId) || null;
  return [...pending].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))[0] || null;
}

export function telegramCommandAvailability(parsed) {
  const command = typeof parsed === "string" ? parseTelegramCommand(parsed).command : parsed?.command;
  if (command === "/add_source" || command === "/add_lens") return "unavailable";
  if (command === "/analyze") return "model_required";
  return "available";
}

export function recentTelegramCommands(recent = [], entry = {}, limit = 20) {
  const existing = Array.isArray(recent) ? recent : [];
  return [entry, ...existing].slice(0, limit);
}
