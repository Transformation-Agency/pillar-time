import { localDateKey, rankActions } from "./timeEngine.js";

export const PRIMARY_CALENDAR_IDS = new Set(["primary", "pjacooper@gmail.com", "paul@transformationagency.com"]);

export function toDateMs(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

export function sameLocalDate(value, dateKey, timezone = "America/Denver") {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && localDateKey(date, timezone) === dateKey;
}

export function daysUntilLocalDate(dateKey, timezone = "America/Denver", from = new Date()) {
  const today = localDateKey(from, timezone);
  return Math.round((new Date(`${dateKey}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86400000);
}

export function localDateTime(dateKey, hhmm = "09:00") {
  const match = String(hhmm || "09:00").match(/^(\d{1,2}):(\d{2})/);
  const hours = match ? Math.max(0, Math.min(23, Number(match[1]))) : 9;
  const minutes = match ? Math.max(0, Math.min(59, Number(match[2]))) : 0;
  return new Date(`${dateKey}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
}

export function calendarRoleForId(calendarId = "") {
  return PRIMARY_CALENDAR_IDS.has(String(calendarId || "").toLowerCase()) ? "primary" : "context";
}

export function isAllDayCalendarEvent(event = {}) {
  if (event.allDay) return true;
  if (event.start?.date && !event.start?.dateTime) return true;
  const start = String(event.start || "");
  const end = String(event.end || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(start) || /^\d{4}-\d{2}-\d{2}$/.test(end);
}

export function isPrimaryBlockingCalendarEvent(event = {}) {
  if (isAllDayCalendarEvent(event)) return false;
  if (!event.calendarId) return true;
  return event.calendarRole === "primary" || PRIMARY_CALENDAR_IDS.has(String(event.calendarId || "").toLowerCase());
}

export function calendarBusyIntervals({ calendarAgenda = [], dateKey, timezone = "America/Denver", bufferMinutes = 0 }) {
  return calendarAgenda
    .filter((event) => isPrimaryBlockingCalendarEvent(event))
    .map((event) => ({ start: toDateMs(event.start), end: toDateMs(event.end), title: event.title || "" }))
    .filter((event) => event.start && event.end && sameLocalDate(event.start, dateKey, timezone))
    .map((event) => ({ ...event, start: event.start - bufferMinutes * 60000, end: event.end + bufferMinutes * 60000 }))
    .sort((a, b) => a.start - b.start);
}

export function calendarFreeWindows({ calendarAgenda = [], dateKey, timezone = "America/Denver", preferences = {} }) {
  const workHours = preferences.workHours || { start: "09:00", end: "17:00", weekdays: [1, 2, 3, 4, 5] };
  const day = localDateTime(dateKey, "12:00").getDay();
  if (Array.isArray(workHours.weekdays) && workHours.weekdays.length && !workHours.weekdays.includes(day)) return [];
  const workStart = localDateTime(dateKey, workHours.start || "09:00").getTime();
  const workEnd = localDateTime(dateKey, workHours.end || "17:00").getTime();
  if (!workStart || !workEnd || workEnd <= workStart) return [];
  const bufferMinutes = Math.max(0, Number(preferences.meetingBufferMinutes || 0));
  const busy = calendarBusyIntervals({ calendarAgenda, dateKey, timezone, bufferMinutes });
  const windows = [];
  let cursor = workStart;
  for (const interval of busy) {
    if (interval.end <= workStart || interval.start >= workEnd) continue;
    const start = Math.max(workStart, interval.start);
    const end = Math.min(workEnd, interval.end);
    if (start > cursor) windows.push({ start: cursor, end: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < workEnd) windows.push({ start: cursor, end: workEnd });
  return windows.filter((window) => window.end - window.start >= 15 * 60000);
}

export function categoryForCandidate(candidate, categoriesByKey) {
  const text = `${candidate.source || ""} ${candidate.leverageCategory || ""} ${candidate.title || ""}`.toLowerCase();
  if (candidate.source === "calendar" || /prep|meeting|call|huddle|checkpoint/.test(text)) return categoriesByKey.get("meeting-prep") || categoriesByKey.get("leadership");
  if (/waiting|follow|unblock|status|comment|reply/.test(text)) return categoriesByKey.get("follow-up") || categoriesByKey.get("leadership");
  if (/admin|inbox|reminder|important_date|form|cleanup/.test(text)) return categoriesByKey.get("admin");
  if (/health|recovery|lunch|movement/.test(text)) return categoriesByKey.get("health");
  if (/learning|research|read|study/.test(text)) return categoriesByKey.get("learning") || categoriesByKey.get("deep-work");
  return categoriesByKey.get("deep-work") || [...categoriesByKey.values()][0];
}

export function proposedCalendarScheduleFromContext(context = {}, { categories = [], calendarId = "primary", idFactory = () => "cal-block" } = {}) {
  const enabledCategories = categories.filter((category) => category.enabled !== false);
  if (!enabledCategories.length) return { blocks: [], windows: [], categories: [], note: "No enabled calendar planning categories." };
  const categoriesByKey = new Map();
  for (const category of enabledCategories) {
    const key = category.id.replace(/^schedule-category-/, "");
    categoriesByKey.set(key, category);
    if (!categoriesByKey.has(category.leverageCategory)) categoriesByKey.set(category.leverageCategory, category);
  }
  const windows = calendarFreeWindows({
    calendarAgenda: context.calendarAgenda || [],
    dateKey: context.dateKey,
    timezone: context.timezone,
    preferences: context.local?.preferences || {},
  });
  const blocks = [];
  let windowIndex = 0;
  let cursor = windows[0]?.start || 0;
  const usedCandidates = new Set();
  const candidates = (context.rankedDayCandidates || []).filter((candidate) => candidate?.title && !/calendar_conflict/i.test(candidate.id || ""));
  for (const candidate of candidates) {
    if (blocks.length >= 8 || !windows[windowIndex]) break;
    if (usedCandidates.has(candidate.id)) continue;
    const category = categoryForCandidate(candidate, categoriesByKey);
    if (!category) continue;
    const requestedMinutes = Math.max(category.minMinutes, Math.min(Number(candidate.estimateMinutes || category.defaultMinutes), category.maxMinutes));
    let durationMs = requestedMinutes * 60000;
    while (windows[windowIndex] && cursor + Math.max(category.minMinutes * 60000, 15 * 60000) > windows[windowIndex].end) {
      windowIndex += 1;
      cursor = windows[windowIndex]?.start || 0;
    }
    const window = windows[windowIndex];
    if (!window) break;
    const remainingMs = window.end - cursor;
    if (remainingMs < category.minMinutes * 60000) continue;
    durationMs = Math.min(durationMs, remainingMs);
    if (durationMs < category.minMinutes * 60000) continue;
    const start = new Date(cursor);
    const end = new Date(cursor + durationMs);
    const summary = `Pillar Time: ${category.calendarTitlePrefix || category.name} - ${candidate.title}`.slice(0, 180);
    blocks.push({
      id: idFactory(),
      calendarId,
      categoryId: category.id,
      categoryName: category.name,
      sourceCandidateId: candidate.id,
      source: candidate.source || "",
      title: candidate.title,
      summary,
      description: [
        "Created from a Pillar Time approved schedule proposal.",
        candidate.reason ? `Why this surfaced: ${candidate.reason}` : "",
        candidate.notes ? `Context: ${candidate.notes}` : "",
      ].filter(Boolean).join("\n"),
      start: start.toISOString(),
      end: end.toISOString(),
      timezone: context.timezone || "America/Denver",
      minutes: Math.round(durationMs / 60000),
    });
    usedCandidates.add(candidate.id);
    cursor = end.getTime() + 5 * 60000;
  }
  return {
    dateKey: context.dateKey,
    timezone: context.timezone || "America/Denver",
    calendarId,
    categories: enabledCategories,
    windows: windows.map((window) => ({ start: new Date(window.start).toISOString(), end: new Date(window.end).toISOString(), minutes: Math.round((window.end - window.start) / 60000) })),
    blocks,
  };
}

export function buildExecutiveCandidates({ calendarAgenda = [], linearContext = {}, local = {}, dateKey, timezone = "America/Denver", feedback = [], nowDate = new Date() }) {
  const candidates = [];
  for (const commitment of local.commitments || []) {
    candidates.push({
      id: `commitment:${commitment.id}`,
      title: commitment.nextAction || commitment.title,
      notes: commitment.description || commitment.notes || "",
      leverageCategory: commitment.leverageCategory || (commitment.priority === "high" ? "leadership" : "admin"),
      reason: commitment.waitingOn ? `Waiting on ${commitment.waitingOn}; moving this may unblock the commitment.` : "Active commitment in the executive record.",
      source: commitment.source || "commitment",
      dueAt: commitment.dueAt,
      estimateMinutes: commitment.estimateMinutes || 30,
      status: commitment.status,
      waitingOn: commitment.waitingOn,
      feedbackKey: commitment.id,
      evidence: commitment.evidence || [],
    });
  }
  for (const task of local.tasks || []) {
    candidates.push({
      id: `task:${task.id}`,
      taskId: task.id,
      title: task.title,
      notes: task.notes,
      leverageCategory: task.leverageCategory,
      reason: task.waitingOn ? `Waiting on ${task.waitingOn}; moving this may unblock someone.` : "Open task from Pillar Time.",
      source: "task",
      dueAt: task.dueAt,
      estimateMinutes: task.estimateMinutes,
      status: task.status,
      waitingOn: task.waitingOn,
      feedbackKey: task.id,
    });
  }
  for (const event of calendarAgenda) {
    if (!isPrimaryBlockingCalendarEvent(event)) continue;
    if (/meet|call|huddle|checkpoint|review|planning|interview|sync|standup/i.test(event.title || "")) {
      candidates.push({
        id: `calendar:${event.id || event.htmlLink || event.title}`,
        title: `Prepare for ${event.title || "calendar event"}`,
        notes: [event.time, event.attendees?.length ? `Attendees: ${event.attendees.join(", ")}` : ""].filter(Boolean).join(" · "),
        leverageCategory: "leadership",
        reason: "Calendar event may need prep, decisions, sequencing, or follow-up.",
        source: "calendar",
        dueAt: event.start,
        estimateMinutes: local.preferences?.meetingBufferMinutes || 10,
        feedbackKey: `calendar:${event.id || event.title}`,
      });
    }
  }
  for (const issue of linearContext.issues || []) {
    const title = `${issue.identifier || "Linear"} ${issue.title || ""}`.trim();
    const dueAt = issue.dueDate ? `${issue.dueDate}T17:00:00` : "";
    const state = String(issue.state?.type || issue.state?.name || "").toLowerCase();
    const priority = Number(issue.priority || 0);
    const stale = toDateMs(issue.updatedAt) && nowDate.getTime() - toDateMs(issue.updatedAt) > 7 * 86400000;
    const leverageCategory = state.includes("started") ? "unblock" : priority > 2 ? "deadline" : issue.project ? "deepWork" : "admin";
    candidates.push({
      id: `linear:${issue.id}`,
      linearIssueId: issue.id,
      title,
      notes: [issue.project?.name, issue.state?.name, issue.url].filter(Boolean).join(" · "),
      leverageCategory,
      reason: stale ? "Linear issue has not moved recently and may need a decision or status update." : "Assigned open Linear issue.",
      source: "linear",
      dueAt,
      estimateMinutes: 30,
      status: state.includes("started") ? "started" : "open",
      priority: issue.priorityLabel || priority,
      feedbackKey: issue.id,
      evidence: [{ type: "linear_issue", id: issue.id, identifier: issue.identifier, url: issue.url }],
    });
  }
  for (const reminder of local.reminders || []) {
    if (reminder.enabled && reminder.nextOccurrence?.dateKey === dateKey) {
      candidates.push({
        id: `reminder:${reminder.id}`,
        title: reminder.title,
        notes: reminder.body,
        leverageCategory: "admin",
        reason: `Reminder due today at ${reminder.nextOccurrence.localTime}.`,
        source: "reminder",
        dueAt: `${dateKey}T${reminder.nextOccurrence.localTime}:00`,
        estimateMinutes: 5,
        feedbackKey: reminder.id,
      });
    }
  }
  for (const date of local.importantDates || []) {
    if (!date.enabled) continue;
    const days = daysUntilLocalDate(date.date, timezone, nowDate);
    if (days >= 0 && days <= 14) {
      candidates.push({
        id: `important-date:${date.id}`,
        title: `${date.title}${days === 0 ? " is today" : ` in ${days} day${days === 1 ? "" : "s"}`}`,
        notes: date.notes,
        leverageCategory: days <= 3 ? "deadline" : "admin",
        reason: "Important date is inside the planning horizon.",
        source: "important_date",
        dueAt: `${date.date}T09:00:00`,
        estimateMinutes: 15,
        feedbackKey: date.id,
      });
    }
  }
  return rankActions(candidates, feedback).map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

export function detectExecutiveRisks({ calendarAgenda = [], linearContext = {}, local = {}, connectorDiagnostics = {}, dateKey, timezone = "America/Denver", nowDate = new Date() }) {
  const risks = [];
  const sortedEvents = [...calendarAgenda].filter((event) => event.start && event.end && isPrimaryBlockingCalendarEvent(event)).sort((a, b) => toDateMs(a.start) - toDateMs(b.start));
  let meetingMinutes = 0;
  for (let i = 0; i < sortedEvents.length; i += 1) {
    const current = sortedEvents[i];
    const duration = Math.max(0, Math.round((toDateMs(current.end) - toDateMs(current.start)) / 60000));
    meetingMinutes += duration;
    const next = sortedEvents[i + 1];
    if (next && toDateMs(current.end) > toDateMs(next.start)) risks.push({ type: "calendar_conflict", severity: "high", title: `Calendar overlap: ${current.title} and ${next.title}`, evidence: [current.id, next.id].filter(Boolean) });
  }
  if (meetingMinutes >= 240) risks.push({ type: "meeting_load", severity: "medium", title: `${Math.round(meetingMinutes / 60)} hours of meetings today`, evidence: { meetingMinutes } });
  if (!connectorDiagnostics.googleCalendar?.succeeded) risks.push({ type: "calendar_unavailable", severity: "medium", title: "Calendar coverage is unavailable", detail: connectorDiagnostics.googleCalendar?.error || "Calendar connector is not ready." });
  if (!connectorDiagnostics.linear?.succeeded) risks.push({ type: "linear_unavailable", severity: "medium", title: "Linear work coverage is unavailable", detail: connectorDiagnostics.linear?.error || "Linear connector is not ready." });
  if (connectorDiagnostics.model?.status !== "ready") risks.push({ type: "model_unavailable", severity: "low", title: "Model connector is not ready", detail: "Using deterministic executive brief fallback." });
  for (const issue of linearContext.issues || []) {
    if (issue.dueDate && issue.dueDate <= dateKey) risks.push({ type: "linear_due", severity: "high", title: `${issue.identifier} is due ${issue.dueDate}`, entityId: issue.id, url: issue.url });
    if (toDateMs(issue.updatedAt) && nowDate.getTime() - toDateMs(issue.updatedAt) > 7 * 86400000) risks.push({ type: "linear_stale", severity: "medium", title: `${issue.identifier} has not moved in over a week`, entityId: issue.id, url: issue.url });
  }
  for (const commitment of local.commitments || []) {
    if (commitment.dueAt && sameLocalDate(commitment.dueAt, dateKey, timezone) && commitment.status !== "done") risks.push({ type: "commitment_due", severity: "high", title: `Commitment due today: ${commitment.title}`, entityId: commitment.id });
    if (commitment.waitingOn) risks.push({ type: "waiting_on", severity: "medium", title: `${commitment.title} is waiting on ${commitment.waitingOn}`, entityId: commitment.id });
  }
  return risks.slice(0, 24);
}
