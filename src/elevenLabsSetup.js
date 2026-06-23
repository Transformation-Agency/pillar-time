export const ELEVENLABS_DEFAULT_MODEL = "eleven_multilingual_v2";

export const ELEVENLABS_PREVIEW_TEXT = "This is your Pillar Time audio preview. Your daily brief can be read aloud with this ElevenLabs voice.";

export function elevenLabsInitialVoices(tts = {}) {
  return tts.voiceId ? [{ id: tts.voiceId, name: tts.voiceName || tts.voiceId }] : [];
}

export function nextElevenLabsVoiceId(voices = [], currentVoiceId = "") {
  const current = String(currentVoiceId || "");
  return voices.some((voice) => voice.id === current) ? current : voices[0]?.id || "";
}

export function elevenLabsVoiceName(voices = [], voiceId = "", fallback = "") {
  return voices.find((voice) => voice.id === voiceId)?.name || fallback || "";
}

export function elevenLabsSetupRequest(action, payload = {}) {
  if (action === "voices") {
    return {
      url: "/api/tts/voices",
      method: "POST",
      body: { apiKey: payload.apiKey || "" },
    };
  }
  if (action === "save") {
    return {
      url: "/api/tts",
      method: "PATCH",
      body: {
        apiKey: payload.apiKey || "",
        voiceId: payload.voiceId || "",
        voiceName: payload.voiceName || "",
        modelId: payload.modelId || ELEVENLABS_DEFAULT_MODEL,
        telegramAutoSend: !!payload.telegramAutoSend,
        enabled: !!payload.enabled,
      },
    };
  }
  if (action === "preview") {
    return {
      url: "/api/tts/preview",
      method: "POST",
      body: {
        apiKey: payload.apiKey || "",
        voiceId: payload.voiceId || "",
        modelId: payload.modelId || ELEVENLABS_DEFAULT_MODEL,
        text: payload.text || ELEVENLABS_PREVIEW_TEXT,
      },
    };
  }
  throw new Error(`Unknown ElevenLabs setup action: ${action}`);
}

export function elevenLabsSaveReadiness({ voiceId = "", apiKey = "", apiKeySaved = false } = {}) {
  if (voiceId || apiKey || apiKeySaved) return { canSave: true, error: "" };
  return { canSave: false, error: "Choose a voice or detect voices before saving ElevenLabs audio." };
}

export function elevenLabsSetupMessageTone(message = "") {
  return /saved|detected|preview/i.test(String(message || "")) ? "ok-text" : "warn-text";
}
