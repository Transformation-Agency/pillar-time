import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProposedCalendarBlocks,
  classifyCalendarEvents,
  localDateKey,
  nextOccurrence,
  rankActions,
  rankExecutiveCandidates,
  sporadicTimes,
} from "../server/timeEngine.js";

test("localDateKey uses the requested timezone", () => {
  assert.equal(localDateKey(new Date("2026-06-18T04:30:00Z"), "America/Denver"), "2026-06-17");
  assert.equal(localDateKey(new Date("2026-06-18T04:30:00Z"), "UTC"), "2026-06-18");
});

test("rankActions favors high-leverage work and honors feedback penalties", () => {
  const ranked = rankActions([
    { id: "admin", title: "File receipts", leverageCategory: "admin", source: "task" },
    { id: "unblock", title: "Send launch decision", leverageCategory: "unblock", source: "task" },
  ], [{ key: "unblock", feedback: "notToday" }]);

  assert.equal(ranked[0].id, "unblock");
  assert.ok(ranked[0].score > ranked[1].score);

  const heavilyPenalized = rankActions([
    { id: "admin", title: "File receipts", leverageCategory: "admin", source: "task" },
    { id: "unblock", title: "Send launch decision", leverageCategory: "unblock", source: "task" },
  ], [{ key: "unblock", feedback: "never" }]);
  assert.equal(heavilyPenalized[0].id, "unblock");
  assert.ok(heavilyPenalized[0].score < ranked[0].score);
});

test("nextOccurrence skips past times today and finds the next weekday", () => {
  const occurrence = nextOccurrence({
    id: "weekday",
    enabled: true,
    scheduleType: "weekday",
    localTime: "09:00",
    startDate: "2026-06-18",
  }, new Date("2026-06-18T16:00:00Z"), "America/Denver");

  assert.deepEqual(occurrence, {
    dateKey: "2026-06-19",
    localTime: "09:00",
    dedupeKey: "weekday:2026-06-19:09:00",
  });
});

test("sporadicTimes is deterministic and respects count and gap", () => {
  const first = sporadicTimes({ id: "reset", dateKey: "2026-06-18", windowStart: "10:00", windowEnd: "17:00", count: 3, minGapMinutes: 60 });
  const second = sporadicTimes({ id: "reset", dateKey: "2026-06-18", windowStart: "10:00", windowEnd: "17:00", count: 3, minGapMinutes: 60 });

  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  assert.ok(first.every((time) => time >= "10:00" && time <= "17:00"));
});

test("calendar classification treats all-day and shared events as context, not blockers", () => {
  const classified = classifyCalendarEvents([
    { id: "holiday", title: "Company holiday", calendarId: "holidays@group.v.calendar.google.com", start: "2026-06-18", end: "2026-06-19", time: "All day" },
    { id: "shared", title: "Shared team launch", calendarId: "team@example.com", start: "2026-06-18T16:00:00.000Z", end: "2026-06-18T17:00:00.000Z" },
    { id: "mine", title: "Sales huddle", calendarId: "pjacooper@gmail.com", start: "2026-06-18T15:00:00.000Z", end: "2026-06-18T15:30:00.000Z", selfResponseStatus: "accepted" },
    { id: "declined", title: "Declined hold", calendarId: "pjacooper@gmail.com", start: "2026-06-18T18:00:00.000Z", end: "2026-06-18T19:00:00.000Z", selfResponseStatus: "declined" },
  ]);

  assert.equal(classified.find((item) => item.id === "holiday").blocksTime, false);
  assert.equal(classified.find((item) => item.id === "holiday").calendarRole, "subscribed");
  assert.equal(classified.find((item) => item.id === "shared").visibility, "softContext");
  assert.equal(classified.find((item) => item.id === "mine").visibility, "hardBlock");
  assert.equal(classified.find((item) => item.id === "mine").blocksTime, true);
  assert.equal(classified.find((item) => item.id === "declined").visibility, "ignore");
});

test("executive ranking includes leverage explanations and calendar prep only for qualifying owned events", () => {
  const calendarClassifications = classifyCalendarEvents([
    { id: "mine", title: "Board review", calendarId: "pjacooper@gmail.com", start: "2026-06-18T18:00:00.000Z", end: "2026-06-18T19:00:00.000Z", selfResponseStatus: "accepted" },
    { id: "holiday", title: "All day context", calendarId: "pjacooper@gmail.com", start: "2026-06-18", end: "2026-06-19", time: "All day" },
  ]);
  const ranked = rankExecutiveCandidates({
    tasks: [{ id: "task-1", title: "Ship launch decision", leverageCategory: "unblock", priority: "high", estimateMinutes: 45 }],
    commitments: [],
    calendarClassifications,
    nowDate: new Date("2026-06-18T12:00:00.000Z"),
  });

  assert.ok(ranked.some((item) => item.id === "task:task-1" && item.whyThis && item.exactNextStep));
  assert.ok(ranked.some((item) => item.id === "calendar:mine"));
  assert.ok(!ranked.some((item) => item.id === "calendar:holiday"));
});

test("proposed calendar blocks preserve hard meetings and ignore all-day blockers", () => {
  const calendarClassifications = classifyCalendarEvents([
    { id: "all-day", title: "Holiday", calendarId: "pjacooper@gmail.com", start: "2026-06-18", end: "2026-06-19", time: "All day" },
    { id: "meeting", title: "Sales huddle", calendarId: "pjacooper@gmail.com", start: "2026-06-18T16:00:00.000Z", end: "2026-06-18T17:00:00.000Z", selfResponseStatus: "accepted" },
  ]);
  const blocks = buildProposedCalendarBlocks({
    dateKey: "2026-06-18",
    timezone: "UTC",
    preferences: { workHours: { start: "09:00", end: "17:00" }, meetingBufferMinutes: 10, focusBlockMinutes: 60 },
    calendarClassifications,
    rankedCandidates: [{ id: "task:deep", title: "Deep build", source: "task", leverageCategory: "deepWork", estimateMinutes: 60, whyThis: "Compounds." }],
    categories: [{ name: "Deep Work", calendarTitlePrefix: "Deep Work: " }],
  });

  assert.ok(blocks.length >= 1);
  assert.ok(blocks.every((block) => new Date(block.end) <= new Date("2026-06-18T15:50:00.000Z") || new Date(block.start) >= new Date("2026-06-18T17:10:00.000Z")));
});
