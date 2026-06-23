export function reviewToggleRequest(review = {}) {
  if (!review.id) {
    throw new Error("Review template id is required.");
  }
  return {
    url: `/api/time/reviews/${review.id}`,
    method: "PATCH",
    body: {
      enabled: !review.enabled,
    },
  };
}

export function reviewToggleSuccessMessage(review = {}) {
  return `${review.title || "Review template"} ${review.enabled ? "disabled" : "enabled"}.`;
}

export async function toggleReviewTemplateFlow({ review, mutate }) {
  try {
    const request = reviewToggleRequest(review);
    await mutate(request.url, request.body, request.method);
    return {
      ok: true,
      message: reviewToggleSuccessMessage(review),
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || "Could not update review.",
    };
  }
}

export function reviewMessageTone(message = "") {
  return message.includes("enabled") || message.includes("disabled") ? "ok-text" : "warn-text";
}
