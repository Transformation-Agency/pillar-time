import { createHash } from "node:crypto";
import { localDateKey } from "./timeEngine.js";

export function shouldDeliverLocalOccurrence(occurrence = {}, timezone = "America/Denver", nowDate = new Date()) {
  const dateKey = localDateKey(nowDate, timezone);
  if (occurrence.dateKey !== dateKey) return false;
  const currentTime = nowDate.toLocaleTimeString("en-US", { timeZone: timezone, hour12: false, hour: "2-digit", minute: "2-digit" });
  return occurrence.localTime <= currentTime;
}

export function reminderOccurrenceId(dedupeKey = "") {
  return `occ-${createHash("sha1").update(String(dedupeKey || "")).digest("hex").slice(0, 16)}`;
}

export function reminderSchedulerDecision({ reminder = {}, prefs = {}, nowDate = new Date() } = {}) {
  if (!prefs.reminderMasterEnabled) return { action: "skip", reason: "master_disabled" };
  if (!reminder.enabled) return { action: "skip", reason: "reminder_disabled" };
  if (reminder.type === "regular" && !prefs.regularRemindersEnabled) return { action: "skip", reason: "regular_disabled" };
  if (reminder.type === "sporadic" && !prefs.sporadicRemindersEnabled) return { action: "skip", reason: "sporadic_disabled" };
  if (reminder.pausedUntil && new Date(reminder.pausedUntil) > nowDate) return { action: "skip", reason: "paused" };
  const occurrence = reminder.nextOccurrence;
  if (!occurrence) return { action: "skip", reason: "no_occurrence" };
  const dedupeKey = occurrence.dedupeKey;
  if (!dedupeKey) return { action: "skip", reason: "missing_dedupe" };
  if (reminder.skippedDedupeKey === dedupeKey) return { action: "skip", reason: "dedupe_skipped", dedupeKey };

  const occurrenceId = reminderOccurrenceId(dedupeKey);
  const due = shouldDeliverLocalOccurrence(occurrence, reminder.timezone || prefs.timezone || "America/Denver", nowDate);
  const channels = reminder.channels || {};
  const enabledChannels = prefs.channels || {};
  const deliveries = [];
  if (due && channels.telegramText && enabledChannels.telegramText) deliveries.push({ channel: "telegram", mode: "text", status: "send" });
  if (due && channels.desktopText && enabledChannels.desktopText) {
    deliveries.push({ channel: "desktop", mode: "text", status: "skipped", error: "Desktop notification adapter pending Tauri notification permission wiring." });
  }
  return {
    action: "schedule",
    occurrence,
    occurrenceId,
    dedupeKey,
    due,
    deliveries,
  };
}
