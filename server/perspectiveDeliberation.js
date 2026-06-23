const deliberationSystemPrompt = [
  "You deliberate over a saved private intelligence brief using user-created perspective lenses.",
  "Each lens should give a distinct, useful take grounded in the saved brief text.",
  "Do not introduce new factual claims unless you clearly mark them as questions or hypotheses.",
  "Return only valid JSON.",
].join(" ");

export function perspectiveDeliberationRequest({ briefText = "", perspectiveLenses = [] } = {}) {
  return {
    system: deliberationSystemPrompt,
    prompt: JSON.stringify({
      task: "Run a perspective deliberation over this saved brief.",
      requiredJsonShape: {
        perspectives: [{ name: "lens name", role: "lens role", take: "specific read on the brief", implication: "what this perspective would do or watch next" }],
        synthesis: "where the perspectives agree, disagree, what matters most, and a practical next move",
      },
      brief: String(briefText || "").slice(0, 18000),
      perspectiveLenses: perspectiveLenses.map((lens) => ({
        name: lens.name,
        role: lens.role,
        description: lens.description,
        instructions: lens.instructions,
      })),
    }),
  };
}

export function normalizedPerspectiveDeliberation({ payload = {}, perspectiveLenses = [], generatedAt } = {}) {
  const deliberation = {
    perspectives: (Array.isArray(payload.perspectives) ? payload.perspectives : []).slice(0, 12).map((item, index) => ({
      name: String(item.name || perspectiveLenses[index]?.name || `Perspective ${index + 1}`).trim(),
      role: String(item.role || perspectiveLenses[index]?.role || "").trim(),
      take: String(item.take || item.read || "").trim(),
      implication: String(item.implication || item.nextMove || "").trim(),
    })).filter((item) => item.name && item.take),
    synthesis: String(payload.synthesis || payload.summary || "").trim(),
    generatedAt,
  };
  if (!deliberation.perspectives.length && !deliberation.synthesis) throw new Error("The model did not return a usable deliberation.");
  return deliberation;
}
