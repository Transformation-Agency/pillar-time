import test from "node:test";
import assert from "node:assert/strict";

import {
  GOOGLE_CALENDAR_WRITE_SCOPE,
  assertGoogleCalendarWriteCredential,
  googleCalendarEventRequest,
  googleCalendarWriteCalendarId,
} from "../server/googleCalendarWrite.js";

test("Google Calendar write readiness requires connection and event write scope", () => {
  assert.throws(() => assertGoogleCalendarWriteCredential({ enabled: false, data: {} }), /not connected/);
  assert.throws(() => assertGoogleCalendarWriteCredential({
    enabled: true,
    data: { refreshToken: "refresh", scope: "https://www.googleapis.com/auth/calendar.calendarlist.readonly" },
  }), /grant calendar event write access/);

  const connector = { enabled: true, data: { refreshToken: "refresh", scope: `profile ${GOOGLE_CALENDAR_WRITE_SCOPE}` } };
  assert.equal(assertGoogleCalendarWriteCredential(connector), connector);
});

test("Google Calendar write calendar selection prefers explicit, then writable primary, then writable calendar", () => {
  assert.equal(googleCalendarWriteCalendarId({ calendarId: "work@example.com" }), "work@example.com");
  assert.equal(googleCalendarWriteCalendarId({
    calendarId: "selected",
    calendars: [
      { id: "group@example.com", accessRole: "reader" },
      { id: "primary@example.com", primary: true, accessRole: "owner" },
      { id: "write@example.com", accessRole: "writer" },
    ],
  }), "primary@example.com");
  assert.equal(googleCalendarWriteCalendarId({
    calendarId: "selected",
    calendars: [
      { id: "group@example.com", accessRole: "reader" },
      { id: "write@example.com", accessRole: "writer" },
    ],
  }), "write@example.com");
  assert.equal(googleCalendarWriteCalendarId({ calendarId: "selected", calendars: [] }), "primary");
});

test("Google Calendar event request validates inputs and preserves Pillar Time metadata", () => {
  assert.throws(() => googleCalendarEventRequest({ start: "2026-06-22T15:00:00Z", end: "2026-06-22T16:00:00Z" }), /summary is required/);
  assert.throws(() => googleCalendarEventRequest({ summary: "Focus block", start: "2026-06-22T15:00:00Z" }), /start and end are required/);

  const request = googleCalendarEventRequest({
    calendarId: "selected",
    credentialData: {
      calendars: [{ id: "paul@example.com", primary: true, accessRole: "owner" }],
    },
    summary: "  Focus block  ",
    description: "Do the hard part.",
    start: "2026-06-22T15:00:00.000Z",
    end: "2026-06-22T16:30:00.000Z",
    timezone: "America/Denver",
    extendedProperties: {
      pillarTimeApprovalId: "approval-1",
      pillarTimeBlockId: "block-1",
    },
  });

  assert.equal(request.targetCalendarId, "paul@example.com");
  assert.deepEqual(request.body, {
    summary: "Focus block",
    description: "Do the hard part.",
    start: { dateTime: "2026-06-22T15:00:00.000Z", timeZone: "America/Denver" },
    end: { dateTime: "2026-06-22T16:30:00.000Z", timeZone: "America/Denver" },
    extendedProperties: { private: { pillarTimeApprovalId: "approval-1", pillarTimeBlockId: "block-1" } },
  });
});
