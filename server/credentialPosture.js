export function telegramPublicSettingsView(row = {}, parseJson = JSON.parse) {
  const parse = typeof parseJson === "function" ? parseJson : JSON.parse;
  let allowedUsers = [];
  let recentCommands = [];
  try { allowedUsers = parse(row.allowed_users || "[]"); } catch {}
  try { recentCommands = parse(row.recent_commands || "[]"); } catch {}
  return {
    enabled: !!row.enabled,
    botToken: row.bot_token ? "configured" : "",
    chatId: row.chat_id,
    allowedUsers,
    lastCheckedAt: row.last_checked_at,
    lastError: row.last_error,
    recentCommands,
    updatedAt: row.updated_at,
    commands: ["/brief", "/sources", "/lenses", "/deliberate", "/review", "/approve", "/reject", "/analyze"],
  };
}

export function storedApiKeyConnectorView(row = {}) {
  const hasKey = !!row.api_key;
  return {
    provider: row.provider,
    enabled: !!row.enabled,
    apiKeySaved: hasKey,
    credentialStatus: hasKey ? "saved" : "missing",
    status: row.enabled && hasKey ? "ready" : "pending credentials",
    lastCheckedAt: row.last_checked_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  };
}

export function linearPublicConnectorView({ row = {}, hasEnvKey = false, teamKey = "TRA", workspaceHint = "" } = {}) {
  return {
    provider: "linear",
    enabled: !!row?.enabled && hasEnvKey,
    apiKeySaved: false,
    credentialStatus: hasEnvKey ? "env" : "missing",
    status: hasEnvKey && row?.enabled ? "ready" : hasEnvKey ? "disabled" : "missing env",
    teamKey,
    workspaceHint,
    writeEnabled: hasEnvKey && !!row?.enabled,
    lastCheckedAt: row?.last_checked_at || null,
    lastError: row?.last_error || "",
    updatedAt: row?.updated_at || null,
  };
}

export function redditPublicConnectorView({ row = {}, data = {}, enabled = false, envClientId = "" } = {}) {
  const source = data || {};
  const hasClientId = !!(source.clientId || envClientId);
  const isEnabled = !!enabled || !!envClientId;
  return {
    provider: "reddit",
    enabled: isEnabled,
    apiKeySaved: hasClientId,
    credentialStatus: hasClientId ? "saved" : "missing",
    status: isEnabled && hasClientId ? "ready" : "pending credentials",
    grantType: source.grantType || (source.clientSecret ? "client_credentials" : "installed_client"),
    tokenExpiresAt: source.expiresAt || null,
    lastCheckedAt: row?.last_checked_at || null,
    lastError: row?.last_error || null,
    updatedAt: row?.updated_at || null,
  };
}

export function googleCalendarPublicConnectorView({
  row = {},
  data = {},
  enabled = false,
  desktopClientId = "",
  defaultScope = "",
  writeScope = "",
} = {}) {
  const hasClient = !!(data.clientId || desktopClientId);
  const hasRefreshToken = !!data.refreshToken;
  const grantedScope = String(data.scope || "");
  const writeReady = writeScope ? grantedScope.split(/\s+/).includes(writeScope) : false;
  return {
    provider: "googleCalendar",
    enabled,
    apiKeySaved: hasRefreshToken,
    clientConfigured: hasClient,
    credentialStatus: hasRefreshToken ? "saved" : hasClient ? "client configured" : "missing",
    status: enabled && hasRefreshToken ? "ready" : hasClient ? "needs consent" : "pending credentials",
    writeReady,
    needsReconnectForWrite: enabled && hasRefreshToken && !writeReady,
    calendarId: data.calendarId || "primary",
    selectedCalendarIds: Array.isArray(data.selectedCalendarIds) && data.selectedCalendarIds.length ? data.selectedCalendarIds : ["primary"],
    calendars: Array.isArray(data.calendars) ? data.calendars : [],
    scope: data.scope || defaultScope,
    redirectUri: data.redirectUri || "",
    lastCheckedAt: row?.last_checked_at || null,
    lastError: row?.last_error || null,
    updatedAt: row?.updated_at || null,
  };
}
