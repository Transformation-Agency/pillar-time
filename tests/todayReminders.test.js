import test from "node:test";
import assert from "node:assert/strict";

import { formatTodayReminderTime, todayReminderRows } from "../src/todayReminders.js";

test("today reminder rows show first six reminders with next occurrence and edit route", () => {
  const reminders = Array.from({ length: 8 }, (_, index) => ({
    id: `reminder-${index + 1}`,
    title: `Reminder ${index + 1}`,
    enabled: index % 2 === 0,
    nextOccurrence: {
      dateKey: "2026-06-22",
      localTime: `${String(8 + index).padStart(2, "0")}:30`,
    },
  }));

  const rows = todayReminderRows({ reminders }, { locale: "en-US" });

  assert.equal(rows.length, 6);
  assert.deepEqual(rows[0], {
    key: "reminder-1",
    title: "Reminder 1",
    sub: "2026-06-22 at 8:30 AM",
    enabled: true,
    statusLabel: "On",
    statusTone: "ok",
    editRoute: "reminders",
  });
  assert.equal(rows[5].title, "Reminder 6");
  assert.equal(rows.some((row) => row.title === "Reminder 7"), false);
});

test("today reminder rows expose off badge copy and no next occurrence fallback", () => {
  assert.deepEqual(todayReminderRows({
    reminders: [{
      id: "quiet",
      title: "Quiet reminder",
      enabled: false,
    }],
  }), [{
    key: "quiet",
    title: "Quiet reminder",
    sub: "No next occurrence",
    enabled: false,
    statusLabel: "Off",
    statusTone: "muted",
    editRoute: "reminders",
  }]);
});

test("today reminder rows tolerate missing ids and titles from api state", () => {
  assert.deepEqual(todayReminderRows({
    reminders: [{
      enabled: true,
      nextOccurrence: { dateKey: "2026-06-22", localTime: "00:05" },
    }],
  }, { locale: "en-US" }), [{
    key: "reminder-0",
    title: "Untitled reminder",
    sub: "2026-06-22 at 12:05 AM",
    enabled: true,
    statusLabel: "On",
    statusTone: "ok",
    editRoute: "reminders",
  }]);
});

test("today reminder time formatter keeps the existing local display style", () => {
  assert.equal(formatTodayReminderTime("14:05", "en-US"), "2:05 PM");
  assert.equal(formatTodayReminderTime("", "en-US"), "8:00 AM");
});
