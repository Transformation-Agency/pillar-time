import test from "node:test";
import assert from "node:assert/strict";

import {
  calendarBusyIntervals,
  calendarFreeWindows,
  calendarRoleForId,
  isPrimaryBlockingCalendarEvent,
  proposedCalendarScheduleFromContext,
} from "../server/executivePlanning.js";

const dateKey = "2026-06-22";
const timezone = "America/Denver";

test("calendar role identifies only primary owner calendars as primary", () => {
  assert.equal(calendarRoleForId("primary"), "primary");
  assert.equal(calendarRoleForId("pjacooper@gmail.com"), "primary");
  assert.equal(calendarRoleForId("paul@transformationagency.com"), "primary");
  assert.equal(calendarRoleForId("group-calendar@example.com"), "context");
});

test("all-day and context calendar events do not block proposed schedule windows", () => {
  const allDay = {
    title: "Observed all-day holiday",
    calendarId: "primary",
    calendarRole: "primary",
    allDay: true,
    start: "2026-06-22",
    end: "2026-06-23",
  };
  const contextTimed = {
    title: "Someone else's group event",
    calendarId: "group-calendar@example.com",
    calendarRole: "context",
    start: "2026-06-22T10:00:00-06:00",
    end: "2026-06-22T11:00:00-06:00",
  };
  const primaryTimed = {
    title: "Primary client call",
    calendarId: "primary",
    calendarRole: "primary",
    start: "2026-06-22T13:00:00-06:00",
    end: "2026-06-22T14:00:00-06:00",
  };

  assert.equal(isPrimaryBlockingCalendarEvent(allDay), false);
  assert.equal(isPrimaryBlockingCalendarEvent(contextTimed), false);
  assert.equal(isPrimaryBlockingCalendarEvent(primaryTimed), true);

  const busy = calendarBusyIntervals({
    calendarAgenda: [allDay, contextTimed, primaryTimed],
    dateKey,
    timezone,
  });

  assert.equal(busy.length, 1);
  assert.equal(busy[0].title, "Primary client call");
});

test("calendar free windows honor primary timed events and meeting buffers", () => {
  const windows = calendarFreeWindows({
    dateKey,
    timezone,
    preferences: {
      workHours: { start: "09:00", end: "17:00", weekdays: [1, 2, 3, 4, 5] },
      meetingBufferMinutes: 15,
    },
    calendarAgenda: [{
      title: "Primary client call",
      calendarId: "primary",
      calendarRole: "primary",
      start: "2026-06-22T13:00:00-06:00",
      end: "2026-06-22T14:00:00-06:00",
    }],
  });

  assert.deepEqual(windows.map((window) => [
    new Date(window.start).toISOString(),
    new Date(window.end).toISOString(),
  ]), [
    ["2026-06-22T15:00:00.000Z", "2026-06-22T18:45:00.000Z"],
    ["2026-06-22T20:15:00.000Z", "2026-06-22T23:00:00.000Z"],
  ]);
});

test("proposed calendar blocks are created from ranked candidates inside available windows", () => {
  let nextId = 1;
  const result = proposedCalendarScheduleFromContext({
    dateKey,
    timezone,
    local: {
      preferences: {
        workHours: { start: "09:00", end: "12:00", weekdays: [1, 2, 3, 4, 5] },
        meetingBufferMinutes: 0,
      },
    },
    calendarAgenda: [{
      title: "Primary standup",
      calendarId: "primary",
      calendarRole: "primary",
      start: "2026-06-22T10:00:00-06:00",
      end: "2026-06-22T10:30:00-06:00",
    }],
    rankedDayCandidates: [
      { id: "candidate-1", title: "Write release note", source: "task", leverageCategory: "deepWork", estimateMinutes: 45, reason: "It unblocks the launch." },
      { id: "calendar_conflict-1", title: "Calendar overlap", source: "calendar", estimateMinutes: 30 },
      { id: "candidate-2", title: "Follow up on blocker", source: "linear", leverageCategory: "unblock", estimateMinutes: 30 },
    ],
  }, {
    calendarId: "primary",
    idFactory: () => `block-${nextId++}`,
    categories: [
      { id: "schedule-category-deep-work", name: "Deep Work", leverageCategory: "deepWork", defaultMinutes: 60, minMinutes: 30, maxMinutes: 120, calendarTitlePrefix: "Focus", enabled: true },
      { id: "schedule-category-follow-up", name: "Follow-up", leverageCategory: "unblock", defaultMinutes: 30, minMinutes: 15, maxMinutes: 45, calendarTitlePrefix: "Follow-up", enabled: true },
    ],
  });

  assert.equal(result.blocks.length, 2);
  assert.equal(result.blocks[0].id, "block-1");
  assert.equal(result.blocks[0].sourceCandidateId, "candidate-1");
  assert.equal(result.blocks[0].start, "2026-06-22T15:00:00.000Z");
  assert.equal(result.blocks[0].end, "2026-06-22T15:45:00.000Z");
  assert.equal(result.blocks[1].sourceCandidateId, "candidate-2");
  assert.match(result.blocks[1].summary, /^Pillar Time: Follow-up - Follow up on blocker/);
  assert.ok(result.blocks.every((block) => !block.sourceCandidateId.startsWith("calendar_conflict")));
});
