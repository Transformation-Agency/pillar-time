export const GOOGLE_CALENDAR_WRITE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function assertGoogleCalendarWriteCredential(connector = {}, writeScope = GOOGLE_CALENDAR_WRITE_SCOPE) {
  const grantedScope = String(connector.data?.scope || "");
  if (!connector.enabled || !connector.data?.refreshToken) throw new Error("Google Calendar is not connected.");
  if (!grantedScope.split(/\s+/).includes(writeScope)) {
    throw new Error("Reconnect Google Calendar to grant calendar event write access before filling your calendar.");
  }
  return connector;
}

export function googleCalendarWriteCalendarId(data = {}) {
  if (data.calendarId && data.calendarId !== "selected") return data.calendarId;
  const calendars = Array.isArray(data.calendars) ? data.calendars : [];
  return calendars.find((calendar) => calendar.primary && /owner|writer/i.test(calendar.accessRole || ""))?.id
    || calendars.find((calendar) => /owner|writer/i.test(calendar.accessRole || ""))?.id
    || "primary";
}

export function googleCalendarEventRequest({
  calendarId = "primary",
  credentialData = {},
  summary,
  description = "",
  start,
  end,
  timezone = "America/Denver",
  extendedProperties = {},
} = {}) {
  if (!String(summary || "").trim()) throw new Error("Calendar event summary is required.");
  if (!start || !end) throw new Error("Calendar event start and end are required.");
  const targetCalendarId = calendarId === "selected" ? googleCalendarWriteCalendarId(credentialData) : calendarId || "primary";
  return {
    targetCalendarId,
    body: {
      summary: String(summary).trim(),
      description: String(description || ""),
      start: { dateTime: new Date(start).toISOString(), timeZone: timezone },
      end: { dateTime: new Date(end).toISOString(), timeZone: timezone },
      extendedProperties: { private: extendedProperties },
    },
  };
}
