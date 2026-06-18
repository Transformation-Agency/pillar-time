import test from "node:test";
import assert from "node:assert/strict";

import {
  localDateKey,
  nextOccurrence,
  rankActions,
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
