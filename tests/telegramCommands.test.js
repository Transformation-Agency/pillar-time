import test from "node:test";
import assert from "node:assert/strict";

import {
  parseTelegramCommand,
  recentTelegramCommands,
  selectTelegramPendingApproval,
  telegramCommandAvailability,
} from "../server/telegramCommands.js";

test("Telegram command parsing normalizes whitespace and command case", () => {
  assert.deepEqual(parseTelegramCommand("  /APPROVE   approval-123  extra "), {
    raw: "/APPROVE approval-123 extra",
    command: "/approve",
    args: ["approval-123", "extra"],
    requestedId: "approval-123",
  });

  assert.deepEqual(parseTelegramCommand(""), {
    raw: "",
    command: "",
    args: [],
    requestedId: "",
  });
});

test("Telegram approval selection only returns pending approvals", () => {
  const rows = [
    { id: "newer", status: "pending", created_at: "2026-06-22T10:05:00.000Z" },
    { id: "executed", status: "executed", created_at: "2026-06-22T10:00:00.000Z" },
    { id: "older", status: "pending", created_at: "2026-06-22T10:01:00.000Z" },
    { id: "rejected", status: "rejected", created_at: "2026-06-22T09:00:00.000Z" },
  ];

  assert.equal(selectTelegramPendingApproval(rows)?.id, "older");
  assert.equal(selectTelegramPendingApproval(rows, "newer")?.id, "newer");
  assert.equal(selectTelegramPendingApproval(rows, "executed"), null);
  assert.equal(selectTelegramPendingApproval(rows, "missing"), null);
});

test("Telegram command availability keeps not-yet-supported commands explicit", () => {
  assert.equal(telegramCommandAvailability("/add_source"), "unavailable");
  assert.equal(telegramCommandAvailability("/add_lens research"), "unavailable");
  assert.equal(telegramCommandAvailability(parseTelegramCommand("/analyze calendar")), "model_required");
  assert.equal(telegramCommandAvailability("/review"), "available");
});

test("Telegram recent command history prepends and caps at twenty entries", () => {
  const recent = Array.from({ length: 25 }, (_, index) => ({ command: `/old-${index}` }));
  const next = recentTelegramCommands(recent, { command: "/brief", result: "ok", ts: "now" });

  assert.equal(next.length, 20);
  assert.equal(next[0].command, "/brief");
  assert.equal(next[19].command, "/old-18");
});
