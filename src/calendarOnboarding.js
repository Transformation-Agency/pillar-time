export async function startCalendarOAuthFlow({ api, refresh, openExternalUrl }) {
  if (typeof api !== "function") throw new Error("API client is required.");
  const result = await api("/api/google-calendar/oauth/start", { method: "POST", body: JSON.stringify({}) });
  await refresh?.();
  await openExternalUrl?.(result.authUrl);
  return "Google consent opened. When it says connected, return here and refresh status.";
}

export async function refreshCalendarStatusFlow({ api, refresh, googleCalendarConnected = false }) {
  if (typeof api !== "function") throw new Error("API client is required.");
  if (googleCalendarConnected) {
    await api("/api/google-calendar/calendars", { method: "POST", body: JSON.stringify({}) });
  } else {
    await api("/api/google-calendar/test", { method: "POST", body: JSON.stringify({}) });
  }
  await refresh?.();
  return "Google Calendar is connected. Brief Setup includes Today's Calendar at the top.";
}

export function calendarSetupMessageTone(message = "") {
  return String(message || "").includes("connected") || String(message || "").includes("opened") ? "ok-text" : "warn-text";
}
