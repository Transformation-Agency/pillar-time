import test from "node:test";
import assert from "node:assert/strict";

import {
  reminderDefaultPatch,
  reminderDefaultsRequest,
  saveReminderDefaultsFlow,
} from "../src/reminderDefaults.js";

test("onboarding reminder gate defaults patch only explicit preference gates", () => {
  assert.deepEqual(reminderDefaultPatch({
    key: "reminderMasterEnabled",
    checked: true,
    preferences: { channels: { desktopText: false } },
  }), { reminderMasterEnabled: true });

  assert.deepEqual(reminderDefaultPatch({
    key: "regularRemindersEnabled",
    checked: false,
  }), { regularRemindersEnabled: false });

  assert.deepEqual(reminderDefaultPatch({
    key: "sporadicRemindersEnabled",
    checked: true,
  }), { sporadicRemindersEnabled: true });
});

test("onboarding reminder channel defaults merge channels without enabling reminder delivery alone", () => {
  const patch = reminderDefaultPatch({
    key: "telegramText",
    checked: true,
    preferences: {
      reminderMasterEnabled: false,
      channels: { desktopText: true, telegramText: false },
    },
  });

  assert.deepEqual(patch, {
    channels: { desktopText: true, telegramText: true },
  });
  assert.equal(Object.hasOwn(patch, "reminderMasterEnabled"), false);
  assert.equal(Object.hasOwn(patch, "regularRemindersEnabled"), false);
  assert.equal(Object.hasOwn(patch, "sporadicRemindersEnabled"), false);
  assert.equal(Object.hasOwn(patch, "enabled"), false);
});

test("onboarding reminder defaults request saves through time preferences only", async () => {
  const preferences = {
    timezone: "America/Denver",
    reminderMasterEnabled: false,
    channels: { desktopText: true, telegramText: false },
  };
  const request = reminderDefaultsRequest(preferences, { reminderMasterEnabled: true });

  assert.deepEqual(request, {
    url: "/api/time/preferences",
    method: "PATCH",
    body: {
      timezone: "America/Denver",
      reminderMasterEnabled: true,
      channels: { desktopText: true, telegramText: false },
    },
  });

  const calls = [];
  const result = await saveReminderDefaultsFlow({
    preferences,
    patch: { channels: { desktopText: false, telegramText: false } },
    mutate: async (url, body, method) => calls.push([url, body, method]),
  });

  assert.deepEqual(result, { ok: true, message: "" });
  assert.deepEqual(calls, [[
    "/api/time/preferences",
    {
      timezone: "America/Denver",
      reminderMasterEnabled: false,
      channels: { desktopText: false, telegramText: false },
    },
    "PATCH",
  ]]);
});

test("onboarding reminder defaults report invalid keys and persistence errors", async () => {
  assert.throws(() => reminderDefaultPatch({ key: "smsText", checked: true }), /Unknown reminder default/);

  const result = await saveReminderDefaultsFlow({
    patch: { reminderMasterEnabled: true },
    mutate: async () => {
      throw new Error("preferences database locked");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    message: "preferences database locked",
  });
});
