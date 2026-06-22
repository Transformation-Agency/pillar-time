import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExecutiveCandidates,
  calendarBusyIntervals,
  calendarFreeWindows,
  calendarRoleForId,
  detectExecutiveRisks,
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

test("executive candidates rank unblocking work and include day-aware context", () => {
  const ranked = buildExecutiveCandidates({
    dateKey,
    timezone,
    nowDate: new Date("2026-06-22T16:00:00.000Z"),
    calendarAgenda: [
      {
        id: "event-primary",
        title: "Launch planning sync",
        calendarId: "primary",
        calendarRole: "primary",
        time: "11:00 AM",
        start: "2026-06-22T11:00:00-06:00",
        end: "2026-06-22T11:30:00-06:00",
      },
      {
        id: "event-context",
        title: "Group FYI sync",
        calendarId: "group@example.com",
        calendarRole: "context",
        time: "1:00 PM",
        start: "2026-06-22T13:00:00-06:00",
        end: "2026-06-22T14:00:00-06:00",
      },
    ],
    linearContext: {
      issues: [
        {
          id: "lin-started",
          identifier: "TRA-10",
          title: "Unblock calendar write approval",
          state: { type: "started", name: "In Progress" },
          priority: 1,
          updatedAt: "2026-06-21T10:00:00.000Z",
          url: "https://linear.app/test/issue/TRA-10",
        },
        {
          id: "lin-backlog",
          identifier: "TRA-11",
          title: "Clean up labels",
          state: { type: "backlog", name: "Backlog" },
          priority: 0,
          updatedAt: "2026-06-21T10:00:00.000Z",
        },
      ],
    },
    local: {
      preferences: { meetingBufferMinutes: 15 },
      commitments: [
        { id: "commit-1", title: "Send partner update", priority: "high", dueAt: "2026-06-22T17:00:00-06:00", status: "open", waitingOn: "Diana" },
      ],
      tasks: [
        { id: "task-1", title: "Draft launch note", leverageCategory: "deepWork", dueAt: "2026-06-23T12:00:00-06:00", status: "open", estimateMinutes: 45 },
      ],
      reminders: [
        { id: "reminder-1", title: "Check approvals", enabled: true, body: "Look for pending approvals.", nextOccurrence: { dateKey, localTime: "15:00" } },
      ],
      importantDates: [
        { id: "date-1", title: "Board packet deadline", enabled: true, date: "2026-06-24", notes: "Two days out." },
      ],
    },
    feedback: [{ key: "lin-backlog", feedback: "never" }],
  });

  const startedLinear = ranked.find((candidate) => candidate.id === "linear:lin-started");
  const backlogLinear = ranked.find((candidate) => candidate.id === "linear:lin-backlog");
  assert.equal(startedLinear.leverageCategory, "unblock");
  assert.ok(startedLinear.rank < backlogLinear.rank);
  assert.ok(ranked.some((candidate) => candidate.id === "calendar:event-primary" && candidate.title === "Prepare for Launch planning sync"));
  assert.ok(!ranked.some((candidate) => candidate.id === "calendar:event-context"));
  assert.ok(ranked.some((candidate) => candidate.id === "reminder:reminder-1"));
  assert.ok(ranked.some((candidate) => candidate.id === "important-date:date-1" && candidate.leverageCategory === "deadline"));
  assert.ok(ranked.every((candidate, index) => candidate.rank === index + 1));
});

test("executive risks detect conflicts, meeting load, stale Linear work, due commitments, and degraded connectors", () => {
  const risks = detectExecutiveRisks({
    dateKey,
    timezone,
    nowDate: new Date("2026-06-22T18:00:00.000Z"),
    calendarAgenda: [
      {
        id: "event-a",
        title: "Client block A",
        calendarId: "primary",
        calendarRole: "primary",
        start: "2026-06-22T09:00:00-06:00",
        end: "2026-06-22T11:00:00-06:00",
      },
      {
        id: "event-b",
        title: "Client block B",
        calendarId: "primary",
        calendarRole: "primary",
        start: "2026-06-22T10:30:00-06:00",
        end: "2026-06-22T12:00:00-06:00",
      },
      {
        id: "event-c",
        title: "Operating review",
        calendarId: "primary",
        calendarRole: "primary",
        start: "2026-06-22T13:00:00-06:00",
        end: "2026-06-22T15:00:00-06:00",
      },
      {
        id: "all-day",
        title: "Shared all-day marker",
        calendarId: "primary",
        calendarRole: "primary",
        allDay: true,
        start: "2026-06-22",
        end: "2026-06-23",
      },
    ],
    linearContext: {
      issues: [
        { id: "lin-due", identifier: "TRA-20", dueDate: "2026-06-22", updatedAt: "2026-06-10T10:00:00.000Z", url: "https://linear.app/test/issue/TRA-20" },
      ],
    },
    local: {
      commitments: [
        { id: "commit-due", title: "Publish investor memo", dueAt: "2026-06-22T16:00:00-06:00", status: "open" },
        { id: "commit-wait", title: "Close customer loop", dueAt: "2026-06-25T16:00:00-06:00", status: "open", waitingOn: "Max" },
        { id: "commit-done", title: "Already done", dueAt: "2026-06-22T12:00:00-06:00", status: "done" },
      ],
    },
    connectorDiagnostics: {
      googleCalendar: { succeeded: true },
      linear: { succeeded: false, error: "LINEAR_API_KEY is not configured." },
      model: { status: "missing" },
    },
  });

  const types = risks.map((risk) => risk.type);
  assert.ok(types.includes("calendar_conflict"));
  assert.ok(types.includes("meeting_load"));
  assert.ok(types.includes("linear_unavailable"));
  assert.ok(types.includes("model_unavailable"));
  assert.ok(types.includes("linear_due"));
  assert.ok(types.includes("linear_stale"));
  assert.ok(types.includes("commitment_due"));
  assert.ok(types.includes("waiting_on"));
  assert.ok(!risks.some((risk) => String(risk.evidence || "").includes("all-day")));
  assert.ok(!risks.some((risk) => risk.type === "calendar_unavailable"));
});
