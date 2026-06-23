export function perspectiveGenerationRequest(prompt = "") {
  return {
    url: "/api/perspective-lenses/generate",
    method: "POST",
    body: { prompt },
  };
}

export function perspectiveGenerationSuccess(lenses = []) {
  const drafts = Array.isArray(lenses) ? lenses : [];
  return {
    drafts,
    message: `Generated ${drafts.length} perspective lens${drafts.length === 1 ? "" : "es"}.`,
  };
}

export function perspectiveGenerationFailure(error) {
  return error?.message || "Could not generate perspective lenses.";
}

export function appendPerspectiveTranscript(currentPrompt = "", transcript = "") {
  const text = String(transcript || "").trim();
  if (!text) {
    return {
      prompt: String(currentPrompt || "").trim(),
      message: "Transcription returned no text. You can try again or type the request.",
      added: false,
    };
  }
  return {
    prompt: `${currentPrompt ? `${currentPrompt} ` : ""}${text}`.trim(),
    message: "Voice input added.",
    added: true,
  };
}

export function perspectiveVoiceFailure(error) {
  return error?.message || "Voice input stopped. You can keep typing instead.";
}
