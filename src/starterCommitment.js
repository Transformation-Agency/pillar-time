export const starterCommitmentMessages = {
  blank: "Write one commitment or priority first.",
  success: "Added to Planner and Today’s Three.",
  fallbackError: "Could not add commitment.",
};

export function normalizeStarterCommitmentTitle(value) {
  return String(value || "").trim();
}

export function starterCommitmentRank(existingCommitments = []) {
  return Math.min(3, (Array.isArray(existingCommitments) ? existingCommitments.length : 0) + 1);
}

export function starterCommitmentRequests(value, existingCommitments = []) {
  const title = normalizeStarterCommitmentTitle(value);
  if (!title) {
    return { ok: false, message: starterCommitmentMessages.blank, requests: [] };
  }

  return {
    ok: true,
    message: "",
    title,
    requests: [
      {
        url: "/api/time/tasks",
        method: "POST",
        body: {
          title,
          source: "onboarding",
          leverageCategory: "deepWork",
          priority: "high",
        },
      },
      {
        url: "/api/time/commitments",
        method: "POST",
        body: {
          title,
          notes: "Added during onboarding.",
          rank: starterCommitmentRank(existingCommitments),
        },
      },
    ],
  };
}

export async function submitStarterCommitmentFlow({
  value,
  existingCommitments = [],
  api,
  refresh,
}) {
  const built = starterCommitmentRequests(value, existingCommitments);
  if (!built.ok) {
    return { ok: false, clearInput: false, message: built.message };
  }

  try {
    for (const request of built.requests) {
      await api(request.url, {
        method: request.method,
        body: JSON.stringify(request.body),
      });
    }
    await refresh();
    return {
      ok: true,
      clearInput: true,
      message: starterCommitmentMessages.success,
      title: built.title,
    };
  } catch (error) {
    return {
      ok: false,
      clearInput: false,
      message: error?.message || starterCommitmentMessages.fallbackError,
    };
  }
}

export function starterCommitmentMessageTone(message = "") {
  return message.includes("Added") ? "ok-text" : "warn-text";
}
