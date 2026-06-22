import test from "node:test";
import assert from "node:assert/strict";

import {
  reminderOccurrenceId,
  reminderSchedulerDecision,
  shouldDeliverLocalOccurrence,
} from "../server/reminderScheduler.js";

const nowDate = new Date("2026-06-22T16:05:00.000Z"); // 10:05 America/Denver
const dueOccurrence = { dateKey: "2026-06-22", localTime: "10:00", dedupeKey: "reminder-1:2026-06-22:10:00" };
const prefs = {
  timezone: "America/Denver",
  reminderMasterEnabled: true,
  regularRemindersEnabled: true,
  sporadicRemindersEnabled: true,
  channels: { telegramText: true, desktopText: true },
};
const reminder = {
  id: "reminder-1",
  title: "Check the plan",
  type: "regular",
  enabled: true,
  timezone: "America/Denver",
  channels: { telegramText: true, desktopText: true },
  nextOccurrence: dueOccurrence,
};

test("shouldDeliverLocalOccurrence respects local date and time", () => {
  assert.equal(shouldDeliverLocalOccurrence(dueOccurrence, "America/Denver", nowDate), true);
  assert.equal(shouldDeliverLocalOccurrence({ ...dueOccurrence, localTime: "10:10" }, "America/Denver", nowDate), false);
  assert.equal(shouldDeliverLocalOccurrence({ ...dueOccurrence, dateKey: "2026-06-23" }, "America/Denver", nowDate), false);
});

test("reminder scheduler skips disabled master, disabled reminder, disabled type gates, pause, and dedupe", () => {
  assert.deepEqual(reminderSchedulerDecision({ reminder, prefs: { ...prefs, reminderMasterEnabled: false }, nowDate }), { action: "skip", reason: "master_disabled" });
  assert.deepEqual(reminderSchedulerDecision({ reminder: { ...reminder, enabled: false }, prefs, nowDate }), { action: "skip", reason: "reminder_disabled" });
  assert.deepEqual(reminderSchedulerDecision({ reminder, prefs: { ...prefs, regularRemindersEnabled: false }, nowDate }), { action: "skip", reason: "regular_disabled" });
  assert.deepEqual(reminderSchedulerDecision({ reminder: { ...reminder, type: "sporadic" }, prefs: { ...prefs, sporadicRemindersEnabled: false }, nowDate }), { action: "skip", reason: "sporadic_disabled" });
  assert.deepEqual(reminderSchedulerDecision({ reminder: { ...reminder, pausedUntil: "2026-06-22T17:00:00.000Z" }, prefs, nowDate }), { action: "skip", reason: "paused" });
  assert.deepEqual(reminderSchedulerDecision({ reminder: { ...reminder, skippedDedupeKey: dueOccurrence.dedupeKey }, prefs, nowDate }), { action: "skip", reason: "dedupe_skipped", dedupeKey: dueOccurrence.dedupeKey });
});

test("reminder scheduler schedules occurrences before due time without delivery attempts", () => {
  const decision = reminderSchedulerDecision({
    reminder: { ...reminder, nextOccurrence: { ...dueOccurrence, localTime: "10:10" } },
    prefs,
    nowDate,
  });

  assert.equal(decision.action, "schedule");
  assert.equal(decision.due, false);
  assert.equal(decision.occurrenceId, reminderOccurrenceId(dueOccurrence.dedupeKey));
  assert.deepEqual(decision.deliveries, []);
});

test("reminder scheduler plans enabled channel deliveries for due occurrences", () => {
  const decision = reminderSchedulerDecision({ reminder, prefs, nowDate });

  assert.equal(decision.action, "schedule");
  assert.equal(decision.due, true);
  assert.equal(decision.occurrenceId, reminderOccurrenceId(dueOccurrence.dedupeKey));
  assert.deepEqual(decision.deliveries, [
    { channel: "telegram", mode: "text", status: "send" },
    { channel: "desktop", mode: "text", status: "skipped", error: "Desktop notification adapter pending Tauri notification permission wiring." },
  ]);
});

test("reminder scheduler only uses channels enabled both on reminder and globally", () => {
  assert.deepEqual(reminderSchedulerDecision({
    reminder: { ...reminder, channels: { telegramText: true, desktopText: true } },
    prefs: { ...prefs, channels: { telegramText: false, desktopText: true } },
    nowDate,
  }).deliveries, [
    { channel: "desktop", mode: "text", status: "skipped", error: "Desktop notification adapter pending Tauri notification permission wiring." },
  ]);

  assert.deepEqual(reminderSchedulerDecision({
    reminder: { ...reminder, channels: { telegramText: false, desktopText: false } },
    prefs,
    nowDate,
  }).deliveries, []);
});
