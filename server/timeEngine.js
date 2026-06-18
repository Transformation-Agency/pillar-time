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
    const penalty = feedbackPenalty.get(item.feedbackKey || item.id || item.title) || 0;
    const score = leverageWeights[category] + deadlineBoost + blockerBoost + sourceBoost - penalty;
    return {
      ...item,
      leverageCategory: category,
      score,
      confidence: item.confidence ?? (item.reason ? 0.78 : 0.58),
      reason: item.reason || reasonForCategory(category),
    };
  }).sort((a, b) => b.score - a.score || String(a.title || "").localeCompare(String(b.title || "")));
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
