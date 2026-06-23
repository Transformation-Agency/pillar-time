export function telegramSettingsPatchPlan(body = {}, current = {}) {
  const nextToken = body.botToken === "configured" ? current.bot_token : String(body.botToken || "").trim();
  const nextChat = String(body.chatId || "").trim();
  const allowedUsers = Array.isArray(body.allowedUsers) ? body.allowedUsers.map((user) => String(user).trim()).filter(Boolean) : [];
  const enabled = !!body.enabled;
  return {
    botToken: nextToken,
    chatId: nextChat,
    allowedUsers,
    enabled,
    lastError: enabled && !nextToken ? "Missing bot token" : enabled && !nextChat ? "Missing chat ID" : "",
    auditNote: enabled ? "Telegram enabled/updated" : "Telegram disabled/updated",
  };
}

export function resolveTelegramBotTokenInput(botToken = "", current = {}) {
  const requestedToken = String(botToken || "").trim();
  if (requestedToken === "configured") return String(current.bot_token || "").trim();
  return requestedToken;
}

export function telegramSettingsReadiness(row = {}) {
  if (!row?.bot_token) return { ok: false, error: "Missing bot token" };
  if (!row?.chat_id) return { ok: false, error: "Missing chat ID" };
  return { ok: true };
}

export function telegramTestText({ botUsername = "", now = new Date() } = {}) {
  const username = botUsername || "unknown";
  return `Pillar Time test message.\nBot: @${username}\nTime: ${now.toLocaleString()}`;
}

export function telegramTestResponse({ botUsername = "", chatId = "" } = {}) {
  return { ok: true, botUsername, chatId };
}
