export const PERSPECTIVE_LENS_UNSAVED_MESSAGE = "Unsaved changes.";
export const PERSPECTIVE_LENS_SAVED_MESSAGE = "Perspective lenses saved.";
export const PERSPECTIVE_LENS_SAVE_ERROR_MESSAGE = "Could not save perspective lenses.";

export function activePerspectiveLensCount(lenses = []) {
  return lenses.filter((lens) => lens.enabled !== false).length;
}

export function newPerspectiveLens(now = Date.now()) {
  return {
    id: `perspective-${now}`,
    name: "New Perspective",
    role: "Point of view",
    description: "",
    instructions: "Read the saved brief from this perspective and name what it notices, worries about, and would do next.",
    enabled: true,
  };
}

export function updatePerspectiveLens(lenses = [], index, patch = {}) {
  return lenses.map((lens, lensIndex) => lensIndex === index ? { ...lens, ...patch } : lens);
}

export function addPerspectiveLens(lenses = [], lens = newPerspectiveLens()) {
  return [...lenses, lens];
}

export function removePerspectiveLens(lenses = [], index) {
  return lenses.filter((_, lensIndex) => lensIndex !== index);
}

export function editPerspectiveLenses(current = [], updater) {
  const lenses = typeof updater === "function" ? updater(current) : updater;
  return {
    lenses,
    dirty: true,
    message: PERSPECTIVE_LENS_UNSAVED_MESSAGE,
  };
}

export function filterPerspectiveLenses(lenses = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return lenses;
  return lenses.filter((lens) => `${lens.name || ""} ${lens.role || ""} ${lens.description || ""}`.toLowerCase().includes(normalizedQuery));
}

export function perspectiveLensSaveRequest(currentConfig = {}, lenses = []) {
  return {
    url: "/api/brief-config",
    method: "PATCH",
    body: {
      ...currentConfig,
      perspectiveLenses: lenses,
    },
  };
}

export async function savePerspectiveLensesFlow({ currentConfig = {}, lenses = [], mutate }) {
  try {
    const request = perspectiveLensSaveRequest(currentConfig, lenses);
    await mutate(request.url, request.body, request.method);
    return { ok: true, dirty: false, message: PERSPECTIVE_LENS_SAVED_MESSAGE };
  } catch (error) {
    return { ok: false, dirty: true, message: error.message || PERSPECTIVE_LENS_SAVE_ERROR_MESSAGE };
  }
}

export function perspectiveLensMessageTone(message = "") {
  if (message.includes("Unsaved")) return "hint";
  if (message.includes("saved")) return "ok-text";
  return "warn-text";
}
