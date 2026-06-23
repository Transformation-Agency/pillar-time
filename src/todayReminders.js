export function formatTodayReminderTime(time = "08:00", locale = []) {
  const [hours = "8", minutes = "00"] = String(time || "08:00").split(":");
  const date = new Date();
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

export function todayReminderRows(time = {}, { limit = 6, locale = [] } = {}) {
  return (time.reminders || []).slice(0, limit).map((reminder, index) => {
    const enabled = !!reminder.enabled;
    const nextOccurrence = reminder.nextOccurrence;
    return {
      key: reminder.id || reminder.title || `reminder-${index}`,
      title: reminder.title || "Untitled reminder",
      sub: nextOccurrence
        ? `${nextOccurrence.dateKey} at ${formatTodayReminderTime(nextOccurrence.localTime, locale)}`
        : "No next occurrence",
      enabled,
      statusLabel: enabled ? "On" : "Off",
      statusTone: enabled ? "ok" : "muted",
      editRoute: "reminders",
    };
  });
}
