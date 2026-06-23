import test from "node:test";
import assert from "node:assert/strict";

import {
  googleCalendarConnectedData,
  googleCalendarListData,
  googleCalendarOAuthStartPlan,
  googleCalendarSelectedCalendarIds,
} from "../server/googleCalendarOAuth.js";

test("Google Calendar OAuth start plan builds PKCE consent URL and preserves selected calendars", () => {
  const plan = googleCalendarOAuthStartPlan({
    body: {},
    currentData: { selectedCalendarIds: ["primary", "work"] },
    defaultClientId: "client-id",
    defaultClientSecret: "client-secret",
    redirectUri: "http://127.0.0.1:42817/api/google-calendar/oauth/callback",
    stateToken: "state-123",
    pkce: { verifier: "verifier-abc", challenge: "challenge-xyz" },
    scope: "calendar.events calendar.list",
  });
  const url = new URL(plan.authUrl);

  assert.equal(url.hostname, "accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), "client-id");
  assert.equal(url.searchParams.get("redirect_uri"), "http://127.0.0.1:42817/api/google-calendar/oauth/callback");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("state"), "state-123");
  assert.equal(url.searchParams.get("code_challenge"), "challenge-xyz");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(plan.data.codeVerifier, "verifier-abc");
  assert.equal(plan.data.clientSecret, "client-secret");
  assert.equal(plan.data.calendarId, "selected");
  assert.deepEqual(plan.data.selectedCalendarIds, ["primary", "work"]);
});

test("Google Calendar OAuth start plan requires a configured client id", () => {
  assert.throws(() => googleCalendarOAuthStartPlan({
    defaultClientId: "",
    redirectUri: "http://localhost/callback",
    stateToken: "state",
    pkce: { verifier: "v", challenge: "c" },
    scope: "scope",
  }), /client ID is not configured/);
});

test("Google Calendar callback data stores refresh token and clears transient OAuth state", () => {
  const data = googleCalendarConnectedData({
    nowMs: 1000,
    currentData: {
      clientId: "client-id",
      clientSecret: "client-secret",
      refreshToken: "old-refresh",
      oauthState: "state",
      codeVerifier: "verifier",
    },
    token: {
      access_token: "new-access",
      expires_in: 7200,
      token_type: "Bearer",
    },
  });

  assert.equal(data.refreshToken, "old-refresh");
  assert.equal(data.accessToken, "new-access");
  assert.equal(data.expiresAt, 7201000);
  assert.equal(data.oauthState, "");
  assert.equal(data.codeVerifier, "");
  assert.throws(() => googleCalendarConnectedData({ currentData: {}, token: { access_token: "no-refresh" } }), /did not return a refresh token/);
});

test("Google Calendar list data keeps explicit selection or falls back to primary/selected calendars", () => {
  assert.deepEqual(googleCalendarListData({
    credentialData: { selectedCalendarIds: ["work"] },
    calendars: [{ id: "primary", primary: true }, { id: "work" }],
  }).selectedCalendarIds, ["work"]);

  assert.deepEqual(googleCalendarListData({
    credentialData: {},
    calendars: [{ id: "primary", primary: true }, { id: "group", selected: true }, { id: "other" }],
  }).selectedCalendarIds, ["primary", "group"]);

  assert.deepEqual(googleCalendarListData({ credentialData: {}, calendars: [] }).selectedCalendarIds, ["primary"]);
  assert.equal(googleCalendarListData({ credentialData: {}, calendars: [] }).calendarId, "selected");
});

test("Google Calendar calendar selection trims, dedupes, and requires one calendar", () => {
  assert.deepEqual(googleCalendarSelectedCalendarIds([" primary ", "work", "primary", "", null]), ["primary", "work"]);
  assert.throws(() => googleCalendarSelectedCalendarIds([]), /Choose at least one calendar/);
  assert.throws(() => googleCalendarSelectedCalendarIds(["  "]), /Choose at least one calendar/);
});
