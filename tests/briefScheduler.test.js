import test from "node:test";
import assert from "node:assert/strict";

import {
  briefDeliveryDueKey,
  parseDeliveryMinutes,
  scheduledBriefDeliveryDecision,
  scheduledSourcePreflightDecision,
  scheduledSourcePreflightReadiness,
  scheduleParts,
  shouldRunSourcePreflight,
} from "../server/briefScheduler.js";

const mondayTenOhFiveDenver = new Date("2026-06-22T16:05:00.000Z");
const baseConfig = {
  deliveryFrequency: "Daily",
  deliveryDay: "Monday",
  deliveryTime: "10:00",
  deliveryTimezone: "America/Denver",
};

test("brief scheduler reads local schedule parts in the configured timezone", () => {
  assert.deepEqual(scheduleParts(mondayTenOhFiveDenver, "America/Denver"), {
    weekday: "Monday",
    dateKey: "2026-06-22",
    minutes: 10 * 60 + 5,
  });
  assert.deepEqual(scheduleParts(mondayTenOhFiveDenver, "America/New_York"), {
    weekday: "Monday",
    dateKey: "2026-06-22",
    minutes: 12 * 60 + 5,
  });
});

test("brief scheduler clamps invalid delivery times to safe defaults", () => {
  assert.equal(parseDeliveryMinutes("07:30"), 7 * 60 + 30);
  assert.equal(parseDeliveryMinutes("99:99"), 23 * 60 + 59);
  assert.equal(parseDeliveryMinutes("not-a-time"), 8 * 60);
});

test("brief delivery due key respects frequency, day, time, and timezone", () => {
  assert.equal(
    briefDeliveryDueKey(mondayTenOhFiveDenver, baseConfig),
    "2026-06-22:America/Denver:Daily:Monday:10:00",
  );
  assert.equal(briefDeliveryDueKey(
    new Date("2026-06-22T15:55:00.000Z"),
    baseConfig,
  ), null);
  assert.equal(briefDeliveryDueKey(
    mondayTenOhFiveDenver,
    { ...baseConfig, deliveryFrequency: "Weekly", deliveryDay: "Tuesday" },
  ), null);
  assert.equal(
    briefDeliveryDueKey(mondayTenOhFiveDenver, { ...baseConfig, deliveryTimezone: "America/New_York", deliveryTime: "12:00" }),
    "2026-06-22:America/New_York:Daily:Monday:12:00",
  );
});

test("source preflight only runs on the exact configured delivery minute", () => {
  assert.equal(
    shouldRunSourcePreflight(new Date("2026-06-22T16:00:00.000Z"), baseConfig),
    "2026-06-22:America/Denver:Daily:Monday:10:00",
  );
  assert.equal(shouldRunSourcePreflight(mondayTenOhFiveDenver, baseConfig), null);
  assert.equal(
    shouldRunSourcePreflight(
      new Date("2026-06-23T16:00:00.000Z"),
      { ...baseConfig, deliveryFrequency: "Weekly", deliveryDay: "Monday" },
    ),
    null,
  );
});

test("scheduled source preflight decision reports run and skip reasons", () => {
  const dueDate = new Date("2026-06-22T16:00:00.000Z");
  const key = "2026-06-22:America/Denver:Daily:Monday:10:00";

  assert.deepEqual(scheduledSourcePreflightDecision({
    nowDate: mondayTenOhFiveDenver,
    config: baseConfig,
    lastPreflightKey: "",
  }), { action: "skip", reason: "not_due", key: null });

  assert.deepEqual(scheduledSourcePreflightDecision({
    nowDate: dueDate,
    config: baseConfig,
    lastPreflightKey: key,
  }), { action: "skip", reason: "already_ran", key });

  assert.deepEqual(scheduledSourcePreflightDecision({
    nowDate: dueDate,
    config: baseConfig,
    lastPreflightKey: "",
  }), { action: "run", key });
});

test("scheduled source preflight readiness reports source health", () => {
  assert.deepEqual(scheduledSourcePreflightReadiness({
    activeSources: [{ id: "rss-1" }, { id: "calendar-1" }],
    itemCount: 3,
    transcriptionResults: [],
    xResults: [],
    rssResults: [{ sourceId: "rss-1", sourceName: "Reuters", ok: true, inserted: 3 }],
    redditResults: [],
    webResults: [],
    calendarResults: [{ sourceId: "calendar-1", sourceName: "Calendar", ok: true, inserted: 0 }],
  }), {
    ready: true,
    activeSourceCount: 2,
    checkedSourceCount: 2,
    failedSourceCount: 0,
    inserted: 3,
    failedSources: [],
  });

  assert.deepEqual(scheduledSourcePreflightReadiness({
    activeSources: [{ id: "rss-1" }],
    itemCount: 0,
    transcriptionResults: [],
    xResults: [],
    rssResults: [{ sourceId: "rss-1", sourceName: "Reuters", ok: false, error: "RSS fetch failed" }],
    redditResults: [],
    webResults: [],
    calendarResults: [],
  }), {
    ready: false,
    activeSourceCount: 1,
    checkedSourceCount: 1,
    failedSourceCount: 1,
    inserted: 0,
    failedSources: [{ sourceId: "rss-1", sourceName: "Reuters", error: "RSS fetch failed" }],
  });

  assert.equal(scheduledSourcePreflightReadiness({ activeSources: [] }).ready, false);
});

test("scheduled brief decision avoids duplicate same-day runs and waits for readiness", () => {
  const key = "2026-06-22:America/Denver:Daily:Monday:10:00";

  assert.deepEqual(scheduledBriefDeliveryDecision({
    nowDate: mondayTenOhFiveDenver,
    config: baseConfig,
    lastDeliveryKey: key,
    alreadyCompletedToday: false,
    ready: true,
  }), { action: "skip", reason: "already_attempted", key });

  assert.deepEqual(scheduledBriefDeliveryDecision({
    nowDate: mondayTenOhFiveDenver,
    config: baseConfig,
    lastDeliveryKey: "",
    alreadyCompletedToday: true,
    ready: true,
  }), { action: "mark_ran", reason: "completed_today", key, dateKey: "2026-06-22" });

  assert.deepEqual(scheduledBriefDeliveryDecision({
    nowDate: mondayTenOhFiveDenver,
    config: baseConfig,
    lastDeliveryKey: "",
    alreadyCompletedToday: false,
    ready: false,
  }), { action: "skip", reason: "not_ready", key, dateKey: "2026-06-22" });
});

test("scheduled brief decision allows one workflow run when due and ready", () => {
  assert.deepEqual(scheduledBriefDeliveryDecision({
    nowDate: mondayTenOhFiveDenver,
    config: baseConfig,
    lastDeliveryKey: "",
    alreadyCompletedToday: false,
    ready: true,
  }), {
    action: "run",
    key: "2026-06-22:America/Denver:Daily:Monday:10:00",
    dateKey: "2026-06-22",
  });
});
