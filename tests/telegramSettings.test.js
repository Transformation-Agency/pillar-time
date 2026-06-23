import test from "node:test";
import assert from "node:assert/strict";

import {
  parseTelegramAllowedUsers,
  telegramSaveMessage,
  telegramSettingsForm,
  telegramSettingsMessageTone,
  telegramSettingsRequest,
  telegramTestMessage,
  telegramTestRequest,
} from "../src/telegramSettings.js";
import {
  telegramSettingsPatchPlan,
  telegramSettingsReadiness,
  telegramTestResponse,
  telegramTestText,
} from "../server/telegramSettings.js";

test("Telegram settings form and request preserve saved token placeholders", () => {
  const form = telegramSettingsForm({
    enabled: true,
    botToken: "configured",
    chatId: "12345",
    allowedUsers: ["paul", "  teammate  "],
  });

  assert.deepEqual(form, {
    enabled: true,
    botToken: "configured",
    chatId: "12345",
    allowedUsers: "paul, teammate",
  });

  assert.deepEqual(telegramSettingsRequest({
    ...form,
    allowedUsers: " paul, teammate, , 12345 ",
  }), {
    url: "/api/telegram",
    method: "PATCH",
    body: {
      enabled: true,
      botToken: "configured",
      chatId: "12345",
      allowedUsers: ["paul", "teammate", "12345"],
    },
  });
});

test("Telegram test request and messages drive save, test, and error tones", () => {
  assert.deepEqual(telegramTestRequest(), {
    url: "/api/telegram/test",
    method: "POST",
    body: {},
  });
  assert.equal(telegramSaveMessage(), "Telegram settings saved.");
  assert.equal(telegramTestMessage({ botUsername: "pillar_time_bot" }), "Test message sent via @pillar_time_bot.");
  assert.equal(telegramTestMessage({}), "Test message sent.");
  assert.equal(telegramSettingsMessageTone("Telegram settings saved."), "ok-text");
  assert.equal(telegramSettingsMessageTone("Test message sent."), "ok-text");
  assert.equal(telegramSettingsMessageTone("Missing chat ID"), "warn-text");
  assert.deepEqual(parseTelegramAllowedUsers([" paul ", "", 123]), ["paul", "123"]);
});

test("Telegram settings patch plan trims input and preserves stored credentials", () => {
  assert.deepEqual(telegramSettingsPatchPlan({
    enabled: true,
    botToken: "configured",
    chatId: "  -100123  ",
    allowedUsers: [" paul ", "", "teammate"],
  }, {
    bot_token: "123456:stored-secret",
  }), {
    botToken: "123456:stored-secret",
    chatId: "-100123",
    allowedUsers: ["paul", "teammate"],
    enabled: true,
    lastError: "",
    auditNote: "Telegram enabled/updated",
  });

  assert.equal(telegramSettingsPatchPlan({ enabled: true, botToken: "", chatId: "42" }, {}).lastError, "Missing bot token");
  assert.equal(telegramSettingsPatchPlan({ enabled: true, botToken: "123:abc", chatId: "" }, {}).lastError, "Missing chat ID");
  assert.equal(telegramSettingsPatchPlan({ enabled: false, botToken: "", chatId: "" }, {}).lastError, "");
});

test("Telegram test helpers validate readiness and shape Telegram message results", () => {
  assert.deepEqual(telegramSettingsReadiness({}), { ok: false, error: "Missing bot token" });
  assert.deepEqual(telegramSettingsReadiness({ bot_token: "123:abc" }), { ok: false, error: "Missing chat ID" });
  assert.deepEqual(telegramSettingsReadiness({ bot_token: "123:abc", chat_id: "42" }), { ok: true });

  const text = telegramTestText({
    botUsername: "pillar_time_bot",
    now: new Date("2026-06-22T12:00:00Z"),
  });
  assert.match(text, /^Pillar Time test message\.\nBot: @pillar_time_bot\nTime: /);
  assert.deepEqual(telegramTestResponse({ botUsername: "pillar_time_bot", chatId: "42" }), {
    ok: true,
    botUsername: "pillar_time_bot",
    chatId: "42",
  });
});
