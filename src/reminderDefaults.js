const reminderGateKeys = new Set([
  "reminderMasterEnabled",
  "regularRemindersEnabled",
  "sporadicRemindersEnabled",
]);

const reminderChannelKeys = new Set([
  "desktopText",
  "telegramText",
]);

export function reminderDefaultPatch({ key, checked, preferences = {} }) {
  if (reminderGateKeys.has(key)) {
    return { [key]: !!checked };
  }

  if (reminderChannelKeys.has(key)) {
    return {
      channels: {
        ...(preferences.channels || {}),
        [key]: !!checked,
      },
    };
  }

  throw new Error(`Unknown reminder default: ${key}`);
}

export function reminderDefaultsRequest(preferences = {}, patch = {}) {
  return {
    url: "/api/time/preferences",
    method: "PATCH",
    body: {
      ...preferences,
      ...patch,
    },
  };
}

export async function saveReminderDefaultsFlow({
  preferences = {},
  patch = {},
  mutate,
}) {
  try {
    const request = reminderDefaultsRequest(preferences, patch);
    await mutate(request.url, request.body, request.method);
    return { ok: true, message: "" };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || "Could not save reminder settings.",
    };
  }
}
