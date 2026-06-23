export function normalizeElevenLabsVoices(payload = {}) {
  return (payload.voices || []).map((voice) => ({
    id: voice.voice_id,
    name: voice.name,
    category: voice.category || "",
    previewUrl: voice.preview_url || "",
  })).filter((voice) => voice.id && voice.name);
}

export function ttsSettingsPatchPlan(body = {}, current = {}, { hasKey = false } = {}) {
  const enabled = body.enabled === undefined ? !!current.enabled : !!body.enabled;
  const voiceId = String(body.voiceId ?? current.voice_id ?? "").trim();
  const voiceName = String(body.voiceName ?? current.voice_name ?? "").trim();
  const modelId = String(body.modelId ?? current.model_id ?? "eleven_multilingual_v2").trim() || "eleven_multilingual_v2";
  const telegramAutoSend = body.telegramAutoSend === undefined ? !!current.telegram_auto_send : !!body.telegramAutoSend;
  return {
    provider: "elevenlabs",
    voiceId,
    voiceName,
    modelId,
    telegramAutoSend,
    enabled,
    lastError: enabled && (!hasKey || !voiceId) ? "Missing ElevenLabs API key or voice" : "",
    auditNote: enabled ? "ElevenLabs TTS enabled/updated" : "ElevenLabs TTS disabled/updated",
  };
}
