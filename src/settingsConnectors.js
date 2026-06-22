export function settingsResearchRows(state = {}) {
  const connectors = state.connectors || {};
  const xConnected = connectors.x?.status === "ready";
  const redditConnected = connectors.reddit?.status === "ready";
  const linearConnected = connectors.linear?.status === "ready";
  const googleCalendarConnected = connectors.googleCalendar?.status === "ready";
  return [
    { service: "X (Twitter)", sub: "Search and monitor posts", type: "Social", logo: "X", status: xConnected ? "Connected" : "Needs token", connected: xConnected, action: "x" },
    { service: "Google Calendar", sub: "Add today's agenda to briefs", type: "Calendar", logo: "Calendar", status: googleCalendarConnected ? "Connected" : connectors.googleCalendar?.status === "needs consent" ? "Needs consent" : "Needs OAuth", connected: googleCalendarConnected, action: "googleCalendar" },
    { service: "Reddit", sub: "Monitor subreddits and posts", type: "Social", logo: "Reddit", status: redditConnected ? "Connected" : "Needs OAuth", connected: redditConnected, action: "reddit" },
    { service: "Linear", sub: "Read and update TRA issues", type: "Project", logo: "Linear", status: linearConnected ? "Connected" : connectors.linear?.credentialStatus === "missing" ? "Needs env key" : "Disabled", connected: linearConnected, action: "linear" },
    { service: "Web Search", sub: "General web search", type: "Search", logo: "Web", status: "Available", connected: true },
    { service: "YouTube", sub: "Channels, uploads, and transcripts", type: "Video", logo: "YouTube", status: "Available", connected: true },
  ];
}

export function connectorModalTarget(action = "") {
  if (["x", "googleCalendar", "reddit", "linear"].includes(action)) return action;
  return "";
}

export function toggleCalendarSelection(current = [], calendarId = "") {
  const selected = Array.isArray(current) ? current : [];
  if (selected.includes(calendarId)) {
    const next = selected.filter((item) => item !== calendarId);
    return next.length ? next : selected;
  }
  return [...selected, calendarId];
}

export function connectorRequest(kind, payload = {}) {
  if (kind === "saveX") return { url: "/api/connectors/x", method: "PATCH", body: { ...payload, enabled: true } };
  if (kind === "saveReddit") return { url: "/api/connectors/reddit", method: "PATCH", body: { ...payload, enabled: true } };
  if (kind === "testReddit") return { url: "/api/reddit/test", method: "POST", body: payload };
  if (kind === "enableLinear") return { url: "/api/connectors/linear", method: "PATCH", body: { enabled: true } };
  if (kind === "disableLinear") return { url: "/api/connectors/linear", method: "PATCH", body: { enabled: false } };
  if (kind === "testLinear") return { url: "/api/linear/test", method: "POST", body: {} };
  if (kind === "startGoogleCalendar") return { url: "/api/google-calendar/oauth/start", method: "POST", body: {} };
  if (kind === "testGoogleCalendar") return { url: "/api/google-calendar/test", method: "POST", body: {} };
  if (kind === "refreshGoogleCalendars") return { url: "/api/google-calendar/calendars", method: "POST", body: {} };
  if (kind === "saveGoogleCalendars") return { url: "/api/google-calendar/calendars", method: "PATCH", body: { selectedCalendarIds: payload.selectedCalendarIds || [] } };
  if (kind === "disconnectGoogleCalendar") return { url: "/api/google-calendar/disconnect", method: "POST", body: {} };
  throw new Error(`Unknown connector action: ${kind || "missing"}`);
}

export function connectorMessageTone(message = "") {
  return /ready|saved|enabled|opened|disconnected|connected/i.test(String(message || "")) ? "ok-text" : "warn-text";
}
