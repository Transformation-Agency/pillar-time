export function parseDeliveryMinutes(time) {
  const match = String(time || "08:00").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 8 * 60;
  const hours = Math.max(0, Math.min(23, Number(match[1])));
  const minutes = Math.max(0, Math.min(59, Number(match[2])));
  return hours * 60 + minutes;
}

export function scheduleParts(date = new Date(), timeZone = "America/Denver") {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
    return {
      weekday: parts.weekday,
      dateKey: `${parts.year}-${parts.month}-${parts.day}`,
      minutes: hour * 60 + Number(parts.minute || 0),
    };
  } catch {
    return {
      weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()],
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      minutes: date.getHours() * 60 + date.getMinutes(),
    };
  }
}

export function sourcePreflightKey(date = new Date(), config = {}) {
  const parts = scheduleParts(date, config.deliveryTimezone);
  return `${parts.dateKey}:${config.deliveryTimezone}:${config.deliveryFrequency}:${config.deliveryDay}:${config.deliveryTime}`;
}

export function shouldRunSourcePreflight(date = new Date(), config = {}) {
  const parts = scheduleParts(date, config.deliveryTimezone);
  if (config.deliveryFrequency === "Weekly" && config.deliveryDay !== parts.weekday) return null;
  const nowMinutes = parts.minutes;
  const targetMinutes = parseDeliveryMinutes(config.deliveryTime);
  return nowMinutes === targetMinutes ? sourcePreflightKey(date, config) : null;
}

export function briefDeliveryDueKey(date = new Date(), config = {}) {
  const parts = scheduleParts(date, config.deliveryTimezone);
  if (config.deliveryFrequency === "Weekly" && config.deliveryDay !== parts.weekday) return null;
  return parts.minutes >= parseDeliveryMinutes(config.deliveryTime) ? sourcePreflightKey(date, config) : null;
}

export function scheduledBriefDeliveryDecision({
  nowDate = new Date(),
  config = {},
  lastDeliveryKey = "",
  alreadyCompletedToday = false,
  ready = false,
} = {}) {
  const key = briefDeliveryDueKey(nowDate, config);
  if (!key) return { action: "skip", reason: "not_due", key: null };
  if (key === lastDeliveryKey) return { action: "skip", reason: "already_attempted", key };

  const parts = scheduleParts(nowDate, config.deliveryTimezone);
  if (alreadyCompletedToday) {
    return { action: "mark_ran", reason: "completed_today", key, dateKey: parts.dateKey };
  }
  if (!ready) return { action: "skip", reason: "not_ready", key, dateKey: parts.dateKey };
  return { action: "run", key, dateKey: parts.dateKey };
}
