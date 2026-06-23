export function requestedPerspectiveLensLimit(promptText = "") {
  const text = String(promptText || "").toLowerCase();
  if (/\b(one|single|a lens|one lens|single lens|one perspective|single perspective)\b/.test(text)) return 1;
  const digit = /\b([2-6])\b/.exec(text);
  if (digit) return Number(digit[1]);
  const wordCounts = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  for (const [word, count] of Object.entries(wordCounts)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return count;
  }
  if (/\b(multiple|several|different perspectives|range of perspectives|set of perspectives|set of lenses|lenses|perspectives)\b/.test(text)) return 4;
  return 1;
}

export function perspectiveLensGenerationPrompt(promptText = "") {
  const lensLimit = requestedPerspectiveLensLimit(promptText);
  return {
    lensLimit,
    system: [
      "You turn natural-language perspective requests into editable perspective lenses for a brief deliberation feature.",
      "Infer how many lenses the user wants from the request.",
      "Default to exactly one comprehensive lens when the user asks for one persona, one named thinker, one role, or one viewpoint.",
      "Generate multiple lenses only when the user clearly asks for multiple, several, a set, a range, or names multiple viewpoints.",
      "When a user references a real person, create an inspired analytical viewpoint, not a claim to represent that person's actual current opinions.",
      "Each lens must be practical, source-grounded, and safe for a private intelligence brief.",
      "Return only valid JSON.",
    ].join(" "),
    prompt: JSON.stringify({
      task: `Generate exactly ${lensLimit} perspective lens${lensLimit === 1 ? "" : "es"} from the user's request.`,
      request: String(promptText || ""),
      countRules: {
        singularDefault: "If the request describes one persona or viewpoint, create one comprehensive lens with a rich role, description, and instructions.",
        multipleOnlyWhenExplicit: "Only create multiple lenses when the user explicitly asks for multiple perspectives or names more than one viewpoint.",
      },
      requiredJsonShape: {
        lenses: [{ name: "short name", role: "perspective role", description: "what it notices", instructions: "how it should evaluate a saved brief", enabled: true }],
      },
    }),
  };
}

export function generatedPerspectiveLensDrafts({ modelText, lensLimit, parseJson, sanitizeLenses, createId }) {
  const payload = parseJson(modelText);
  const rawLenses = Array.isArray(payload.lenses) ? payload.lenses : [];
  const lenses = sanitizeLenses(rawLenses.map((lens, index) => ({
    ...lens,
    id: lens.id || createId(`perspective-${index + 1}`),
  }))).slice(0, lensLimit);
  if (!lenses.length) throw new Error("The model did not return usable perspective lenses.");
  return lenses;
}
