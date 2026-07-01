const leverageWeights = {
  unblock: 100,
  launchRevenue: 88,
  leadership: 78,
  deadline: 72,
  healthFamilyRecovery: 66,
  deepWork: 58,
  admin: 34,
};

export const leverageCategories = Object.keys(leverageWeights);
export const defaultPrimaryCalendarIds = ["pjacooper@gmail.com", "paul@transformationagency.com"];

export function localDateKey(date = new Date(), timezone = "America/Denver") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function minutesFromHHMM(value = "09:00") {
  const [h, m] = String(value || "09:00").split(":").map((part) => Number(part));
  return Math.max(0, Math.min(1439, (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0)));
}

export function hhmmFromMinutes(value = 0) {
  const minutes = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function deterministicNumber(seed = "") {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function rankActions(candidates = [], feedback = []) {
  const feedbackPenalty = new Map();
  for (const item of feedback) {
    if (!item?.key) continue;
    const amount = item.feedback === "never" ? 40 : item.feedback === "incorrect" ? 24 : item.feedback === "notToday" ? 12 : 0;
    feedbackPenalty.set(item.key, Math.max(feedbackPenalty.get(item.key) || 0, amount));
  }
  return candidates.map((item) => {
    const category = leverageCategories.includes(item.leverageCategory) ? item.leverageCategory : "admin";
    const deadlineBoost = item.dueAt ? Math.max(0, 28 - Math.floor((new Date(item.dueAt).getTime() - Date.now()) / 3600000)) : 0;
    const blockerBoost = item.status === "blocked" || item.waitingOn ? 8 : 0;
    const sourceBoost = item.source === "calendar" ? 4 : item.source === "task" ? 6 : 0;
    const priorityBoost = item.priority === "high" ? 42 : item.priority === "normal" ? 8 : item.priority === "low" ? -8 : 0;
    const penalty = feedbackPenalty.get(item.feedbackKey || item.id || item.title) || 0;
    const score = leverageWeights[category] + deadlineBoost + blockerBoost + sourceBoost + priorityBoost - penalty;
    return {
      ...item,
      leverageCategory: category,
      score,
      confidence: item.confidence ?? (item.reason ? 0.78 : 0.58),
      reason: item.reason || (item.priority === "high" ? `High priority. ${reasonForCategory(category)}` : reasonForCategory(category)),
    };
  }).sort((a, b) => b.score - a.score || String(a.title || "").localeCompare(String(b.title || "")));
}

function cleanCalendarId(value = "") {
  return String(value || "").trim().toLowerCase();
}

function parseEventTime(value = "") {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDateOnly(value = "") {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function eventMinutes(event = {}) {
  if (!event.start || !event.end || isDateOnly(event.start) || isDateOnly(event.end)) return 0;
  const start = parseEventTime(event.start);
  const end = parseEventTime(event.end);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function classifyCalendarEvents(events = [], options = {}) {
  const primaryIds = new Set((options.primaryCalendarIds || defaultPrimaryCalendarIds).map(cleanCalendarId));
  return (events || []).map((event, index) => {
    const calendarId = cleanCalendarId(event.calendarId || event.sourceCalendarId || event.calendarEmail || "");
    const attendeeStatus = String(event.selfResponseStatus || event.attendeeStatus || "").toLowerCase();
    const organizerEmail = cleanCalendarId(event.organizerEmail || "");
    const isAllDay = isDateOnly(event.start) || String(event.time || "").toLowerCase() === "all day";
    const durationMinutes = eventMinutes(event);
    const isPrimaryCalendar = primaryIds.has(calendarId) || calendarId === "primary";
    const isSubscribedCalendar = /holiday|import\.calendar|group\.v\.calendar/i.test(calendarId);
    const isSharedCalendar = !!calendarId && !isPrimaryCalendar;
    const isDeclined = attendeeStatus === "declined" || String(event.status || "").toLowerCase() === "cancelled";
    const isOrganizer = organizerEmail && primaryIds.has(organizerEmail);
    const isAttendee = Array.isArray(event.attendees) ? event.attendees.length > 0 : !!event.attendeeCount;
    const isMine = !isDeclined && (isPrimaryCalendar || attendeeStatus === "accepted" || isOrganizer || !!event.selfAttendee);
    let visibility = "softContext";
    if (isDeclined) visibility = "ignore";
    else if (isAllDay) visibility = /travel|flight|retreat|conference|onsite|offsite/i.test(event.title || "") && isMine ? "softContext" : "backgroundContext";
    else if (isMine && isPrimaryCalendar) visibility = "hardBlock";
    else if (isMine) visibility = "softContext";
    else if (isSubscribedCalendar) visibility = "backgroundContext";
    const blocksTime = visibility === "hardBlock" && !isAllDay;
    const confidence = isDeclined ? 0.95 : isPrimaryCalendar || attendeeStatus ? 0.86 : isSharedCalendar ? 0.62 : 0.55;
    return {
      id: event.id || event.htmlLink || `calendar-${index + 1}`,
      title: event.title || event.summary || "Calendar event",
      start: event.start || "",
      end: event.end || "",
      time: event.time || "",
      calendar: event.calendar || "",
      calendarId,
      calendarRole: isPrimaryCalendar ? "primary" : isSubscribedCalendar ? "subscribed" : isSharedCalendar ? "shared" : "unknown",
      isAllDay,
      isTimed: !isAllDay,
      durationMinutes,
      isPrimaryCalendar,
      isSharedCalendar,
      isSubscribedCalendar,
      attendeeStatus: attendeeStatus || "unknown",
      organizerEmail,
      isOrganizer: !!isOrganizer,
      isAttendee: !!isAttendee,
      isMine: !!isMine,
      blocksTime,
      visibility,
      confidence,
      event,
    };
  });
}

function feedbackPenaltyFor(feedback = []) {
  const penalties = new Map();
  for (const item of feedback || []) {
    if (!item?.key) continue;
    const amount = item.feedback === "never" ? 140 : item.feedback === "incorrect" ? 112 : item.feedback === "notToday" ? 84 : 0;
    penalties.set(item.key, Math.max(penalties.get(item.key) || 0, amount));
  }
  return penalties;
}

export function rankExecutiveCandidates({ tasks = [], commitments = [], calendarClassifications = [], feedback = [], nowDate = new Date() } = {}) {
  const penalties = feedbackPenaltyFor(feedback);
  const candidates = [];
  for (const commitment of commitments || []) {
    candidates.push({
      id: `commitment:${commitment.id}`,
      title: commitment.title,
      source: "commitment",
      leverageCategory: "leadership",
      priority: "high",
      estimateMinutes: commitment.estimateMinutes || 30,
      authorityBasis: "Already accepted as a protected commitment.",
      objectiveServed: commitment.notes || commitment.description || "Keep an explicit commitment from slipping.",
      constraintRelieved: "Reduces open-loop pressure.",
      exactNextStep: commitment.nextAction || `Protect time for ${commitment.title}.`,
      whyThis: "This is already selected as a commitment, so the day should protect it before adding more.",
      tradeoff: "This may displace lower-leverage admin or shared-calendar noise.",
      confidence: 0.88,
      feedbackKey: commitment.id,
    });
  }
  for (const task of tasks || []) {
    const isLinear = task.source === "linear" || task.sourceSystem === "linear";
    candidates.push({
      id: `${isLinear ? "linear" : "task"}:${task.id}`,
      taskId: task.id,
      title: task.title,
      notes: task.notes,
      leverageCategory: task.leverageCategory || "admin",
      priority: task.priority || "normal",
      source: isLinear ? "linear" : "task",
      sourceSystem: task.sourceSystem || task.source || "local",
      dueAt: task.dueAt,
      estimateMinutes: task.estimateMinutes || 30,
      status: task.status,
      waitingOn: task.waitingOn,
      feedbackKey: task.id,
      authorityBasis: isLinear ? "Fresh Linear issue assigned to the user; changes still require explicit approval." : "Local task; user may accept, defer, or archive.",
      objectiveServed: task.goal || task.project || reasonForCategory(task.leverageCategory || "admin"),
      constraintRelieved: task.waitingOn ? `Waiting on ${task.waitingOn}; moving this may unblock someone.` : task.dependencies || "Moves captured work toward done.",
      exactNextStep: task.notes || `Spend ${task.estimateMinutes || 30} minutes moving: ${task.title}.`,
      whyThis: task.waitingOn ? "This may unblock another person or decision." : isLinear ? "This is live assigned project work that can be protected on the calendar." : reasonForCategory(task.leverageCategory || "admin"),
      tradeoff: "Choosing this means not using the next block for calendar prep or reactive work.",
      confidence: task.priority === "high" ? 0.82 : 0.68,
    });
  }
  for (const item of calendarClassifications || []) {
    if (item.visibility === "ignore" || item.isAllDay || !item.isMine) continue;
    const needsPrep = /call|huddle|meeting|checkpoint|review|planning|interview|demo|sales|board|investor/i.test(item.title);
    if (!needsPrep) continue;
    candidates.push({
      id: `calendar:${item.id}`,
      title: `Prepare for ${item.title}`,
      leverageCategory: item.visibility === "hardBlock" ? "leadership" : "admin",
      source: "calendar",
      dueAt: item.start,
      estimateMinutes: 10,
      feedbackKey: `calendar:${item.id}`,
      authorityBasis: item.visibility === "hardBlock" ? "Accepted or primary-calendar timed event." : "Calendar context only; confirm before treating as commitment.",
      objectiveServed: "Show up prepared for a real meeting rather than reacting in the room.",
      constraintRelieved: "Reduces meeting ambiguity and follow-up debt.",
      exactNextStep: `Before ${item.time || item.start}, write the desired outcome, key question, and follow-up owner for ${item.title}.`,
      whyThis: item.visibility === "hardBlock" ? "This is a timed event that appears to be yours and may need preparation." : "This may matter, but it is softer context than primary commitments.",
      tradeoff: "Do this only if it beats protected focus work; do not let calendar noise crowd the day.",
      confidence: Math.min(0.9, item.confidence || 0.65),
      calendarClassificationId: item.id,
    });
  }
  return candidates.map((candidate) => {
    const category = leverageCategories.includes(candidate.leverageCategory) ? candidate.leverageCategory : "admin";
    const dueMs = candidate.dueAt ? new Date(candidate.dueAt).getTime() - nowDate.getTime() : Infinity;
    const urgencyBoost = Number.isFinite(dueMs) ? Math.max(0, Math.min(28, 24 - Math.floor(dueMs / 3600000))) : 0;
    const authorityBoost = /Already accepted|primary-calendar|Accepted/i.test(candidate.authorityBasis || "") ? 10 : 0;
    const constraintBoost = /unblock|waiting|constraint|bottleneck/i.test(`${candidate.constraintRelieved || ""} ${candidate.waitingOn || ""}`) ? 12 : 0;
    const flowBoost = candidate.source === "commitment" ? 14 : candidate.status === "in_progress" ? 10 : 0;
    const priorityBoost = candidate.priority === "high" ? 28 : candidate.priority === "normal" ? 6 : candidate.priority === "low" ? -8 : 0;
    const penalty = penalties.get(candidate.feedbackKey || candidate.id || candidate.title) || 0;
    return {
      ...candidate,
      leverageCategory: category,
      score: leverageWeights[category] + urgencyBoost + authorityBoost + constraintBoost + flowBoost + priorityBoost - penalty,
    };
  }).sort((a, b) => b.score - a.score || String(a.title || "").localeCompare(String(b.title || "")));
}

function minutesToHHMM(total = 0) {
  const minutes = Math.max(0, Math.min(1439, Math.round(total)));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function dateAtLocalTime(dateKey, hhmm, timezone = "America/Denver") {
  const [hour, minute] = String(hhmm || "09:00").split(":").map(Number);
  const utcGuess = new Date(`${dateKey}T${String(hour || 0).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(utcGuess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const currentMinutes = Number(values.hour) * 60 + Number(values.minute);
  const targetMinutes = (Number(hour) || 0) * 60 + (Number(minute) || 0);
  return new Date(utcGuess.getTime() + (targetMinutes - currentMinutes) * 60000);
}

export function buildProposedCalendarBlocks({ dateKey = localDateKey(new Date()), timezone = "America/Denver", preferences = {}, rankedCandidates = [], calendarClassifications = [], categories = [] } = {}) {
  const work = preferences.workHours || { start: "09:00", end: "17:00" };
  const buffer = Math.max(0, Number(preferences.meetingBufferMinutes || 10));
  const hardBlocks = (calendarClassifications || [])
    .filter((item) => item.blocksTime && item.start && item.end)
    .map((item) => ({
      start: parseEventTime(item.start),
      end: parseEventTime(item.end),
      title: item.title,
    }))
    .filter((item) => item.start && item.end)
    .sort((a, b) => a.start - b.start);
  const windows = [];
  let cursor = dateAtLocalTime(dateKey, work.start || "09:00", timezone);
  const dayEnd = dateAtLocalTime(dateKey, work.end || "17:00", timezone);
  for (const block of hardBlocks) {
    const paddedStart = new Date(block.start.getTime() - buffer * 60000);
    if (paddedStart > cursor) windows.push({ start: cursor, end: paddedStart });
    cursor = new Date(Math.max(cursor.getTime(), block.end.getTime() + buffer * 60000));
  }
  if (dayEnd > cursor) windows.push({ start: cursor, end: dayEnd });
  const categoryByName = new Map((categories || []).map((category) => [String(category.name || "").toLowerCase(), category]));
  const blocks = [];
  const candidates = (rankedCandidates || [])
    .filter((candidate) => candidate.source !== "calendar")
    .sort((a, b) => {
      const adminA = (a.leverageCategory || "admin") === "admin" ? 1 : 0;
      const adminB = (b.leverageCategory || "admin") === "admin" ? 1 : 0;
      return adminA - adminB || Number(b.score || 0) - Number(a.score || 0);
    })
    .slice(0, 6);
  for (const candidate of candidates) {
    const minutes = Math.max(15, Math.min(120, Number(candidate.estimateMinutes || (candidate.leverageCategory === "deepWork" ? preferences.focusBlockMinutes || 90 : 45))));
    const window = windows.find((slot) => (slot.end.getTime() - slot.start.getTime()) / 60000 >= minutes);
    if (!window) continue;
    const categoryName = candidate.source === "linear" ? "Linear Execution" : candidate.leverageCategory === "deepWork" ? "Deep Work" : "Admin";
    const category = categoryByName.get(categoryName.toLowerCase()) || {};
    const start = window.start;
    const end = new Date(start.getTime() + minutes * 60000);
    blocks.push({
      id: `proposed:${candidate.id}`,
      title: `${category.calendarTitlePrefix || ""}${candidate.title}`,
      category: categoryName,
      sourceCandidateId: candidate.id,
      start: start.toISOString(),
      end: end.toISOString(),
      minutes,
      reason: candidate.whyThis || candidate.reason || "Protect time for high-leverage work.",
      approvalRequired: true,
    });
    window.start = new Date(end.getTime() + buffer * 60000);
  }
  const prepCandidates = (rankedCandidates || []).filter((candidate) => candidate.source === "calendar").slice(0, 4);
  for (const candidate of prepCandidates) {
    const due = parseEventTime(candidate.dueAt);
    if (!due) continue;
    const minutes = Math.max(10, Math.min(30, Number(candidate.estimateMinutes || 10)));
    const end = new Date(due.getTime() - buffer * 60000);
    const start = new Date(end.getTime() - minutes * 60000);
    if (start < dateAtLocalTime(dateKey, work.start || "09:00", timezone)) continue;
    blocks.push({
      id: `proposed:${candidate.id}`,
      title: `Prep: ${candidate.title.replace(/^Prepare for\s+/i, "")}`,
      category: "Meeting Prep",
      sourceCandidateId: candidate.id,
      start: start.toISOString(),
      end: end.toISOString(),
      minutes,
      reason: candidate.whyThis || "Prepare before the meeting starts.",
      approvalRequired: true,
    });
  }
  return blocks.sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

export function reasonForCategory(category = "admin") {
  const reasons = {
    unblock: "This may unblock another person or decision.",
    launchRevenue: "This appears connected to launch, customer, or revenue momentum.",
    leadership: "This is a leadership rep: decide, communicate, or own the next move.",
    deadline: "This has time pressure or a hard commitment attached.",
    healthFamilyRecovery: "This protects health, family, recovery, or sustainable performance.",
    deepWork: "This is focused build, writing, strategy, or production work.",
    admin: "This is useful maintenance, but likely lower leverage than the other options.",
  };
  return reasons[category] || reasons.admin;
}

export function nextOccurrence(reminder, from = new Date(), timezone = "America/Denver") {
  if (!reminder || reminder.enabled === false) return null;
  if (reminder.type === "sporadic") {
    const sporadic = reminder.sporadic || {};
    const windowStart = sporadic.windowStart || "10:00";
    const windowEnd = sporadic.windowEnd || "16:00";
    const count = Math.max(1, Math.min(8, Number(sporadic.count || 2)));
    const minGapMinutes = Math.max(15, Math.min(480, Number(sporadic.minGapMinutes || 120)));
    const cursor = new Date(from);
    const currentDateKey = localDateKey(from, timezone);
    const currentTime = from.toLocaleTimeString("en-US", { timeZone: timezone, hour12: false, hour: "2-digit", minute: "2-digit" });
    for (let day = 0; day < 370; day += 1) {
      const candidate = new Date(cursor.getTime() + day * 86400000);
      const dateKey = localDateKey(candidate, timezone);
      const startDate = reminder.startDate || currentDateKey;
      if (dateKey < startDate) continue;
      if (reminder.endDate && dateKey > reminder.endDate) return null;
      const times = sporadicTimes({ id: reminder.id || "sporadic", dateKey, windowStart, windowEnd, count, minGapMinutes });
      const localTime = times.find((time) => dateKey !== currentDateKey || time > currentTime);
      if (localTime) return { dateKey, localTime, dedupeKey: `${reminder.id || "reminder"}:${dateKey}:${localTime}` };
    }
    return null;
  }
  const type = reminder.scheduleType || "once";
  const startDate = reminder.startDate || localDateKey(from, timezone);
  const localTime = reminder.localTime || "09:00";
  const selectedWeekdays = Array.isArray(reminder.weekdays) ? reminder.weekdays.map(Number) : [];
  const cursor = new Date(from);
  for (let day = 0; day < 370; day += 1) {
    const candidate = new Date(cursor.getTime() + day * 86400000);
    const dateKey = localDateKey(candidate, timezone);
    if (dateKey < startDate) continue;
    if (reminder.endDate && dateKey > reminder.endDate) return null;
    const jsDay = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
    const allowed = type === "once"
      ? dateKey === startDate
      : type === "daily"
        ? true
      : type === "weekday"
        ? jsDay >= 1 && jsDay <= 5
      : type === "selected-days"
        ? selectedWeekdays.includes(jsDay)
      : type === "weekly"
        ? jsDay === Number(reminder.weekday ?? new Date(`${startDate}T12:00:00Z`).getUTCDay())
      : type === "monthly"
        ? Number(dateKey.slice(8, 10)) === Number(reminder.monthDay || startDate.slice(8, 10))
      : type === "quarterly"
        ? Number(dateKey.slice(8, 10)) === Number(reminder.monthDay || startDate.slice(8, 10)) && [0, 3, 6, 9].includes((Number(dateKey.slice(5, 7)) - Number(startDate.slice(5, 7)) + 12) % 12)
      : true;
    if (!allowed) continue;
    const occurrence = { dateKey, localTime, dedupeKey: `${reminder.id || "reminder"}:${dateKey}:${localTime}` };
    if (dateKey === localDateKey(from, timezone) && minutesFromHHMM(localTime) <= minutesFromHHMM(from.toLocaleTimeString("en-US", { timeZone: timezone, hour12: false, hour: "2-digit", minute: "2-digit" }))) continue;
    return occurrence;
  }
  return null;
}

export function sporadicTimes({ id = "sporadic", dateKey, windowStart = "10:00", windowEnd = "16:00", count = 2, minGapMinutes = 120 } = {}) {
  const start = minutesFromHHMM(windowStart);
  const end = Math.max(start + 1, minutesFromHHMM(windowEnd));
  const slots = [];
  let guard = 0;
  while (slots.length < count && guard < 200) {
    const value = start + Math.floor(deterministicNumber(`${id}:${dateKey}:${guard}`) * (end - start));
    if (!slots.some((slot) => Math.abs(slot - value) < minGapMinutes)) slots.push(value);
    guard += 1;
  }
  return slots.sort((a, b) => a - b).map(hhmmFromMinutes);
}
