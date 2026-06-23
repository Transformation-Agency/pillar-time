import test from "node:test";
import assert from "node:assert/strict";

import {
  telegramPaired,
  telegramPairingMessageTone,
  telegramPairingPollMessage,
  telegramPairingPollRequest,
  telegramPairingStartMessage,
  telegramPairingStartRequests,
  telegramPairingStatusView,
} from "../src/telegramPairing.js";

test("Telegram pairing starts by validating token then creating pairing session", () => {
  assert.deepEqual(telegramPairingStartRequests(" 123:abc "), [
    {
      url: "/api/telegram/token/validate",
      method: "POST",
      body: { botToken: "123:abc" },
    },
    {
      url: "/api/telegram/pairing/start",
      method: "POST",
      body: { botToken: "123:abc" },
    },
  ]);
  assert.equal(telegramPairingStartMessage(), "Pairing code is live. In Telegram, chat with your bot, send /start, then reply with the code shown here.");
});

test("Telegram pairing poll request and messages reflect session outcomes", () => {
  assert.deepEqual(telegramPairingPollRequest("pair_123"), {
    url: "/api/telegram/pairing/pair_123/poll",
    method: "POST",
    body: {},
  });
  assert.throws(() => telegramPairingPollRequest(""), /session id is required/);

  assert.equal(telegramPairingPollMessage({ status: "paired" }), "Paired. Telegram delivery is ready.");
  assert.equal(telegramPairingPollMessage({ status: "expired", error: "Code expired." }), "Code expired.");
  assert.equal(telegramPairingPollMessage({ status: "waiting" }), "");
});

test("Telegram paired state accepts either paired session or saved enabled settings", () => {
  assert.equal(telegramPaired({ session: { status: "paired" }, telegram: {} }), true);
  assert.equal(telegramPaired({ session: { status: "waiting" }, telegram: { enabled: true, chatId: "123", botToken: "token" } }), true);
  assert.equal(telegramPaired({ session: { status: "waiting" }, telegram: { enabled: true, chatId: "", botToken: "token" } }), false);
});

test("Telegram pairing status view drives connected, waiting, and failed UI states", () => {
  assert.deepEqual(telegramPairingStatusView({
    session: { status: "waiting", botUsername: "pillar_time_bot" },
    telegram: {},
  }), {
    paired: false,
    status: "waiting",
    title: "Waiting for Telegram",
    botLabel: "@pillar_time_bot",
    badgeTone: "muted",
    badgeLabel: "waiting",
  });

  assert.deepEqual(telegramPairingStatusView({
    session: { status: "failed", error: "bad token" },
    telegram: {},
    bot: "pillar_time_bot",
  }), {
    paired: false,
    status: "failed",
    title: "Pairing status",
    botLabel: "@pillar_time_bot",
    badgeTone: "warn",
    badgeLabel: "failed",
  });

  assert.equal(telegramPairingStatusView({
    session: null,
    telegram: { enabled: true, chatId: "123", botToken: "token" },
  }).badgeLabel, "Connected");
});

test("Telegram pairing message tone distinguishes live/paired text from warnings", () => {
  assert.equal(telegramPairingMessageTone("Pairing code is live."), "ok-text");
  assert.equal(telegramPairingMessageTone("Paired. Telegram delivery is ready."), "ok-text");
  assert.equal(telegramPairingMessageTone("Invalid token"), "warn-text");
});
