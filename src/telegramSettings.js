export function telegramSettingsForm(telegram = {}) {
  const allowedUsers = Array.isArray(telegram.allowedUsers) ? parseTelegramAllowedUsers(telegram.allowedUsers) : [];
  return {
    enabled: !!telegram.enabled,
    botToken: telegram.botToken || "",
    chatId: telegram.chatId || "",
    allowedUsers: allowedUsers.join(", "),
  };
}

export function parseTelegramAllowedUsers(value = "") {
  if (Array.isArray(value)) return value.map((user) => String(user).trim()).filter(Boolean);
  return String(value || "").split(",").map((user) => user.trim()).filter(Boolean);
}

export function telegramSettingsRequest(form = {}, { enabled = form.enabled } = {}) {
  return {
    url: "/api/telegram",
    method: "PATCH",
    body: {
      ...form,
      enabled: !!enabled,
      allowedUsers: parseTelegramAllowedUsers(form.allowedUsers),
    },
  };
}

export function telegramTestRequest() {
  return { url: "/api/telegram/test", method: "POST", body: {} };
}

export function telegramSaveMessage() {
  return "Telegram settings saved.";
}

export function telegramTestMessage(response = {}) {
  return `Test message sent${response.botUsername ? ` via @${response.botUsername}` : ""}.`;
}

export function telegramSettingsMessageTone(message = "") {
  return /sent|saved/i.test(String(message || "")) ? "ok-text" : "warn-text";
}
