export async function executeApprovalAction(current, {
  payload = {},
  by = "operator",
  createGoogleCalendarEvent,
  linearClient,
} = {}) {
  if (!current) throw new Error("Approval not found");
  if (current.status !== "approved") throw new Error("Approve this action before executing it.");

  if (current.kind === "calendar_schedule") {
    if (payload.operation !== "createScheduleBlocks") throw new Error(`Unsupported calendar approval operation: ${payload.operation || "missing"}`);
    const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];
    if (!blocks.length) throw new Error("Calendar schedule approval has no blocks to create.");
    if (typeof createGoogleCalendarEvent !== "function") throw new Error("Google Calendar executor is not configured.");

    const result = { operation: payload.operation, createdEvents: [] };
    for (const block of blocks) {
      const event = await createGoogleCalendarEvent({
        calendarId: block.calendarId || payload.calendarId || "primary",
        summary: block.summary || block.title,
        description: block.description || "",
        start: block.start,
        end: block.end,
        timezone: block.timezone || payload.timezone || "America/Denver",
        extendedProperties: {
          pillarTimeApprovalId: current.id,
          pillarTimeBlockId: block.id || "",
          pillarTimeCategoryId: block.categoryId || "",
        },
      });
      result.createdEvents.push({ id: event.id, htmlLink: event.htmlLink, summary: event.summary, start: event.start, end: event.end });
    }
    return {
      result,
      resolutionNote: `Created ${result.createdEvents.length} Google Calendar event${result.createdEvents.length === 1 ? "" : "s"}.`,
      auditEvent: "approval.executed",
      auditSummary: "Executed Google Calendar schedule approval",
      auditPayload: result,
      by,
    };
  }

  if (current.kind !== "linear_action") throw new Error(`Unsupported approval kind: ${current.kind}`);
  const client = typeof linearClient === "function" ? linearClient() : linearClient;
  if (!client) throw new Error("Linear executor is not configured.");

  let result;
  if (payload.operation === "addComment") {
    if (!payload.issueId || !String(payload.body || "").trim()) throw new Error("Linear comment action is missing issueId or body.");
    const comment = await client.addComment(payload.issueId, String(payload.body));
    const issue = payload.verification?.refetchIssue ? await client.issue(payload.issueId) : null;
    result = { operation: payload.operation, comment, issue };
  } else if (payload.operation === "updateIssue") {
    if (!payload.issueId || !payload.input) throw new Error("Linear update action is missing issueId or input.");
    const issue = await client.updateIssue(payload.issueId, payload.input);
    result = { operation: payload.operation, issue };
  } else if (payload.operation === "createIssue") {
    if (!payload.input?.teamId || !payload.input?.title) throw new Error("Linear create action is missing teamId or title.");
    const issue = await client.createIssue(payload.input);
    result = { operation: payload.operation, issue };
  } else {
    throw new Error(`Unsupported Linear approval operation: ${payload.operation || "missing"}`);
  }

  return {
    result,
    resolutionNote: `Executed ${payload.operation} and verified with Linear.`,
    auditEvent: "approval.executed",
    auditSummary: `Executed Linear ${payload.operation}`,
    auditPayload: result,
    by,
  };
}
