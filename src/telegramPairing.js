export function telegramPaired({ session = null, telegram = {} } = {}) {
  return session?.status === "paired" || !!(telegram.enabled && telegram.chatId && telegram.botToken);
}

export function telegramPairingStartRequests(botToken = "") {
  const token = String(botToken || "").trim();
  return [
    {
      url: "/api/telegram/token/validate",
      method: "POST",
      body: { botToken: token },
    },
    {
      url: "/api/telegram/pairing/start",
      method: "POST",
      body: { botToken: token },
    },
  ];
}

export function telegramPairingPollRequest(sessionId) {
  if (!sessionId) throw new Error("Telegram pairing session id is required.");
  return {
    url: `/api/telegram/pairing/${sessionId}/poll`,
    method: "POST",
    body: {},
  };
}

export function telegramPairingStartMessage() {
  return "Pairing code is live. In Telegram, chat with your bot, send /start, then reply with the code shown here.";
}

export function telegramPairingPollMessage(session = {}) {
  if (session.status === "paired") return "Paired. Telegram delivery is ready.";
  if (["failed", "expired"].includes(session.status)) return session.error || "Pairing stopped. Start a new code.";
  return "";
}

export function telegramPairingMessageTone(message = "") {
  return message.includes("ready") || message.includes("live") || message.includes("Paired") ? "ok-text" : "warn-text";
}

export function telegramPairingStatusView({ session = null, telegram = {}, bot = "" } = {}) {
  const paired = telegramPaired({ session, telegram });
  const status = paired ? "paired" : session?.status || "waiting";
  const botUsername = bot || session?.botUsername || "";
  return {
    paired,
    status,
    title: paired ? "Telegram paired" : session?.status === "waiting" ? "Waiting for Telegram" : "Pairing status",
    botLabel: botUsername ? `@${botUsername}` : "Telegram bot",
    badgeTone: paired ? "ok" : session?.status === "failed" || session?.status === "expired" ? "warn" : "muted",
    badgeLabel: paired ? "Connected" : session?.status || "waiting",
  };
}
