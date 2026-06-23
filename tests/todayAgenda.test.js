import test from "node:test";
import assert from "node:assert/strict";

import { latestCalendarAgenda, todayAgendaRows } from "../src/todayAgenda.js";

function event(number, patch = {}) {
  return {
    title: `Event ${number}`,
    start: `2026-06-22T${String(8 + number).padStart(2, "0")}:00:00-06:00`,
    end: `2026-06-22T${String(9 + number).padStart(2, "0")}:00:00-06:00`,
    calendarUrl: `https://calendar.example/events/${number}`,
    ...patch,
  };
}

test("today agenda uses the latest completed run with artifact calendarAgenda", () => {
  const state = {
    workflowRuns: [
      { id: "running", status: "running", artifact: { calendarAgenda: [event(99)] } },
      { id: "latest-complete", status: "completed", artifact: { calendarAgenda: [event(1)] } },
      { id: "older-complete", status: "completed", artifact: { calendarAgenda: [event(2)] } },
    ],
  };

  assert.deepEqual(latestCalendarAgenda(state), [event(1)]);
});

test("today agenda falls back to legacy calendarFetch events", () => {
  const state = {
    workflowRuns: [{
      id: "legacy",
      status: "completed",
      artifact: {
        calendarFetches: [
          { events: [event(1)] },
          { events: [event(2, { summary: "Fallback summary", title: "" })] },
        ],
      },
    }],
  };

  assert.deepEqual(latestCalendarAgenda(state), [
    event(1),
    event(2, { summary: "Fallback summary", title: "" }),
  ]);
});

test("today agenda rows cap at eight and preserve calendar open URLs", () => {
  const state = {
    workflowRuns: [{
      id: "complete",
      status: "completed",
      artifact: {
        calendarAgenda: Array.from({ length: 10 }, (_, index) => event(index + 1)),
      },
    }],
  };

  const rows = todayAgendaRows(state);

  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0], {
    key: "Event 1-0",
    title: "Event 1",
    sub: "2026-06-22T09:00:00-06:00 to 2026-06-22T10:00:00-06:00",
    calendarUrl: "https://calendar.example/events/1",
  });
  assert.equal(rows[7].title, "Event 8");
  assert.equal(rows[7].calendarUrl, "https://calendar.example/events/8");
});

test("today agenda row text falls back to summary, when, and defaults", () => {
  const state = {
    workflowRuns: [{
      id: "complete",
      status: "completed",
      artifact: {
        calendarAgenda: [
          { summary: "Summary only", when: "All day" },
          {},
        ],
      },
    }],
  };

  assert.deepEqual(todayAgendaRows(state), [
    {
      key: "Summary only-0",
      title: "Summary only",
      sub: "All day",
      calendarUrl: "",
    },
    {
      key: "Calendar event-1",
      title: "Calendar event",
      sub: "Today",
      calendarUrl: "",
    },
  ]);
});
