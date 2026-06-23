export function quickTaskCaptureRequest(value = "") {
  const title = String(value || "").trim();
  if (!title) {
    return {
      ok: false,
      message: "Add a task or obligation first.",
    };
  }
  return {
    ok: true,
    url: "/api/time/tasks",
    method: "POST",
    body: {
      title,
      source: "quick-capture",
    },
  };
}

export async function submitQuickTaskCapture({ value = "", mutate }) {
  const request = quickTaskCaptureRequest(value);
  if (!request.ok) return { ok: false, clearInput: false, message: request.message };

  try {
    await mutate(request.url, request.body, request.method);
    return { ok: true, clearInput: true, message: "", title: request.body.title };
  } catch (error) {
    return {
      ok: false,
      clearInput: false,
      message: error?.message || "Could not capture task.",
    };
  }
}
