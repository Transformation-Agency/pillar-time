export function approvalQueueItemsForRender({ brief = {}, artifact = {} } = {}) {
  const actual = Array.isArray(artifact.approvalItems)
    ? artifact.approvalItems
      .filter((item) => item && item.status !== "rejected")
      .map((item) => {
        const status = item.status ? ` (${item.status})` : "";
        return `${item.title || item.kind || "Approval item"}${status}`;
      })
      .filter(Boolean)
    : [];
  if (actual.length) return actual;
  return Array.isArray(brief.approvalRead) ? brief.approvalRead.filter(Boolean) : [];
}
