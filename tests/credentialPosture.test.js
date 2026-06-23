import test from "node:test";
import assert from "node:assert/strict";

import {
  googleCalendarPublicConnectorView,
  linearPublicConnectorView,
  redditPublicConnectorView,
  storedApiKeyConnectorView,
  telegramPublicSettingsView,
} from "../server/credentialPosture.js";
import { modelSettingsView } from "../server/modelConfig.js";

function assertNoSecrets(value, secrets) {
  const serialized = JSON.stringify(value);
  for (const secret of secrets) {
    assert.doesNotMatch(serialized, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
}

test("public credential views mask stored provider keys and Telegram bot tokens", () => {
  const x = storedApiKeyConnectorView({
    provider: "x",
    api_key: "xox-secret-token",
    enabled: 1,
    last_checked_at: "2026-06-22T12:00:00.000Z",
  });
  const elevenlabs = storedApiKeyConnectorView({
    provider: "elevenlabs",
    api_key: "eleven-secret-key",
    enabled: 1,
  });
  const telegram = telegramPublicSettingsView({
    enabled: 1,
    bot_token: "123456:telegram-secret",
    chat_id: "chat-1",
    allowed_users: "[\"paul\"]",
    recent_commands: "[{\"command\":\"/review\"}]",
  }, JSON.parse);

  assert.equal(x.apiKeySaved, true);
  assert.equal(x.credentialStatus, "saved");
  assert.equal(elevenlabs.status, "ready");
  assert.equal(telegram.botToken, "configured");
  assert.deepEqual(telegram.allowedUsers, ["paul"]);
  assertNoSecrets({ x, elevenlabs, telegram }, ["xox-secret-token", "eleven-secret-key", "telegram-secret"]);
});

test("Linear public connector is environment-only and never reports a saved key", () => {
  const withoutEnv = linearPublicConnectorView({ row: { enabled: 1, api_key: "linear-db-secret" }, hasEnvKey: false });
  const withEnv = linearPublicConnectorView({ row: { enabled: 1, api_key: "linear-db-secret" }, hasEnvKey: true });

  assert.equal(withoutEnv.apiKeySaved, false);
  assert.equal(withoutEnv.credentialStatus, "missing");
  assert.equal(withoutEnv.status, "missing env");
  assert.equal(withEnv.apiKeySaved, false);
  assert.equal(withEnv.credentialStatus, "env");
  assert.equal(withEnv.status, "ready");
  assert.equal(withEnv.writeEnabled, true);
  assertNoSecrets({ withoutEnv, withEnv }, ["linear-db-secret"]);
});

test("Reddit and Google Calendar public views expose readiness without OAuth secrets", () => {
  const reddit = redditPublicConnectorView({
    row: { last_error: "" },
    enabled: true,
    data: {
      clientId: "reddit-client-id",
      clientSecret: "reddit-secret",
      accessToken: "reddit-access",
      grantType: "client_credentials",
      expiresAt: 1790000000000,
    },
  });
  const googleCalendar = googleCalendarPublicConnectorView({
    enabled: true,
    desktopClientId: "desktop-client",
    defaultScope: "read write",
    writeScope: "write",
    data: {
      clientId: "gcal-client",
      clientSecret: "gcal-secret",
      refreshToken: "gcal-refresh",
      accessToken: "gcal-access",
      scope: "read write",
      selectedCalendarIds: ["primary", "work"],
      calendars: [{ id: "primary", summary: "Primary" }],
    },
  });

  assert.equal(reddit.status, "ready");
  assert.equal(reddit.apiKeySaved, true);
  assert.equal(reddit.grantType, "client_credentials");
  assert.equal(googleCalendar.status, "ready");
  assert.equal(googleCalendar.apiKeySaved, true);
  assert.equal(googleCalendar.writeReady, true);
  assert.deepEqual(googleCalendar.selectedCalendarIds, ["primary", "work"]);
  assertNoSecrets({ reddit, googleCalendar }, ["reddit-secret", "reddit-access", "gcal-secret", "gcal-refresh", "gcal-access"]);
});

test("model settings view reports provider credential status without echoing API keys", () => {
  const view = modelSettingsView({
    row: {
      provider: "openai",
      model: "gpt-test",
      api_key: "legacy-model-secret",
      enabled: 1,
    },
    activeProviderKey: "active-model-secret",
    providerCredentials: {
      openai: { apiKeySaved: true, credentialStatus: "saved" },
      anthropic: { apiKeySaved: false, credentialStatus: "missing" },
    },
  });

  assert.equal(view.apiKeySaved, true);
  assert.equal(view.credentialStatus, "saved");
  assert.equal(Object.hasOwn(view, "apiKey"), false);
  assertNoSecrets(view, ["legacy-model-secret", "active-model-secret"]);
});
