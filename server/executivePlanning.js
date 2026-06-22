import { localDateKey } from "./timeEngine.js";

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
