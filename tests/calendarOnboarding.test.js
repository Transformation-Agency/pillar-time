import test from "node:test";
import assert from "node:assert/strict";

import {
  calendarSetupMessageTone,
  refreshCalendarStatusFlow,
  startCalendarOAuthFlow,
} from "../src/calendarOnboarding.js";

test("onboarding calendar OAuth flow starts server OAuth, refreshes state, then opens auth URL", async () => {
  const calls = [];
  const message = await startCalendarOAuthFlow({
    api: async (url, options) => {
      calls.push(["api", url, options.method, options.body]);
      return { authUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=gcal" };
    },
    refresh: async () => calls.push(["refresh"]),
    openExternalUrl: async (url) => calls.push(["open", url]),
  });

  assert.equal(message, "Google consent opened. When it says connected, return here and refresh status.");
  assert.deepEqual(calls, [
    ["api", "/api/google-calendar/oauth/start", "POST", "{}"],
    ["refresh"],
    ["open", "https://accounts.google.com/o/oauth2/v2/auth?state=gcal"],
  ]);
});

test("onboarding calendar refresh loads calendars when already connected", async () => {
  const calls = [];
  const message = await refreshCalendarStatusFlow({
    googleCalendarConnected: true,
    api: async (url, options) => calls.push(["api", url, options.method, options.body]),
    refresh: async () => calls.push(["refresh"]),
  });

  assert.equal(message, "Google Calendar is connected. Brief Setup includes Today's Calendar at the top.");
  assert.deepEqual(calls, [
    ["api", "/api/google-calendar/calendars", "POST", "{}"],
    ["refresh"],
  ]);
});

test("onboarding calendar refresh tests the connector before calendars are connected", async () => {
  const calls = [];
  await refreshCalendarStatusFlow({
    googleCalendarConnected: false,
    api: async (url, options) => calls.push(["api", url, options.method, options.body]),
    refresh: async () => calls.push(["refresh"]),
  });

  assert.deepEqual(calls, [
    ["api", "/api/google-calendar/test", "POST", "{}"],
    ["refresh"],
  ]);
});

test("onboarding calendar message tone distinguishes success and warning text", () => {
  assert.equal(calendarSetupMessageTone("Google consent opened."), "ok-text");
  assert.equal(calendarSetupMessageTone("Google Calendar is connected."), "ok-text");
  assert.equal(calendarSetupMessageTone("OAuth state did not match."), "warn-text");
});
