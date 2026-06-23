export function googleCalendarOAuthStartPlan({
  body = {},
  currentData = {},
  defaultClientId = "",
  defaultClientSecret = "",
  redirectUri = "",
  stateToken = "",
  pkce = {},
  scope = "",
} = {}) {
  const clientId = String(body.clientId || defaultClientId || "").trim();
  const clientSecret = String(body.clientSecret || defaultClientSecret || "").trim();
  if (!clientId) throw new Error("Google Calendar OAuth client ID is not configured.");
  const data = {
    ...currentData,
    clientId,
    clientSecret: clientSecret || "",
    redirectUri,
    oauthState: stateToken,
    codeVerifier: pkce.verifier,
    scope,
    calendarId: "selected",
    selectedCalendarIds: currentData.selectedCalendarIds || ["primary"],
  };
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: stateToken,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
  })}`;
  return { data, authUrl };
}

export function googleCalendarConnectedData({ currentData = {}, token = {}, nowMs = Date.now() } = {}) {
  const data = {
    ...currentData,
    refreshToken: token.refresh_token || currentData.refreshToken || "",
    accessToken: token.access_token || "",
    expiresAt: nowMs + Number(token.expires_in || 3600) * 1000,
    tokenType: token.token_type || "Bearer",
    oauthState: "",
    codeVerifier: "",
  };
  if (!data.refreshToken) throw new Error("Google did not return a refresh token. Try connecting again and approve offline access.");
  return data;
}

export function googleCalendarListData({ credentialData = {}, calendars = [] } = {}) {
  const currentSelected = Array.isArray(credentialData.selectedCalendarIds) && credentialData.selectedCalendarIds.length
    ? credentialData.selectedCalendarIds
    : calendars.filter((calendar) => calendar.primary || calendar.selected).map((calendar) => calendar.id);
  return {
    ...credentialData,
    calendars,
    selectedCalendarIds: currentSelected.length ? currentSelected : ["primary"],
    calendarId: "selected",
  };
}

export function googleCalendarSelectedCalendarIds(input = []) {
  const selectedCalendarIds = Array.from(new Set((Array.isArray(input) ? input : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)));
  if (!selectedCalendarIds.length) throw new Error("Choose at least one calendar.");
  return selectedCalendarIds;
}
