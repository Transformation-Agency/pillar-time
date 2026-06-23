export function constitutionUpdatePlan({ current = {}, input = {}, now = new Date(), idFactory = () => "" } = {}) {
  const currentBody = current.body && typeof current.body === "object" ? current.body : {};
  const body = input.body && typeof input.body === "object" ? input.body : currentBody;
  const editor = String(input.editor || "local-user").trim() || "local-user";
  const reason = String(input.reason || "Updated Trusted Context constitution").trim() || "Updated Trusted Context constitution";
  const fromVersion = Number(current.version || 0);
  const toVersion = fromVersion + 1;
  const createdAt = now instanceof Date ? now.toISOString() : String(now);
  const id = idFactory();

  return {
    row: {
      id,
      version: toVersion,
      body,
      editor,
      reason,
      createdAt,
    },
    audit: {
      action: "trusted_context.constitution_updated",
      entityType: "context_constitution",
      entityId: id,
      note: reason,
      diff: { fromVersion, toVersion },
      actor: editor,
    },
  };
}
