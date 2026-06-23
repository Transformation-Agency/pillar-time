export function latestCalendarAgenda(state = {}) {
  const completed = (state.workflowRuns || []).find((run) => run.status === "completed" && run.artifact);
  if (!completed) return [];
  if (Array.isArray(completed.artifact.calendarAgenda)) return completed.artifact.calendarAgenda;
  if (Array.isArray(completed.artifact.calendarFetches)) {
    return completed.artifact.calendarFetches.flatMap((fetch) => fetch.events || []);
  }
  return [];
}

export function todayAgendaRows(state = {}, limit = 8) {
  return latestCalendarAgenda(state).slice(0, limit).map((event, index) => ({
    key: `${event.title || event.summary || "Calendar event"}-${index}`,
    title: event.title || event.summary || "Calendar event",
    sub: [event.start, event.end].filter(Boolean).join(" to ") || event.when || "Today",
    calendarUrl: event.calendarUrl || "",
  }));
}
