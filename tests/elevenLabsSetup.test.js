import test from "node:test";
import assert from "node:assert/strict";

import {
  ELEVENLABS_DEFAULT_MODEL,
  ELEVENLABS_PREVIEW_TEXT,
  elevenLabsInitialVoices,
  elevenLabsSaveReadiness,
  elevenLabsSetupMessageTone,
  elevenLabsSetupRequest,
  elevenLabsVoiceName,
  nextElevenLabsVoiceId,
} from "../src/elevenLabsSetup.js";
import {
  normalizeElevenLabsVoices,
  ttsSettingsPatchPlan,
} from "../server/ttsSettings.js";

test("ElevenLabs setup helpers preserve saved voice and choose detected voices", () => {
  assert.deepEqual(elevenLabsInitialVoices({ voiceId: "v_saved", voiceName: "Saved Voice" }), [
    { id: "v_saved", name: "Saved Voice" },
  ]);
  assert.deepEqual(elevenLabsInitialVoices({ voiceId: "v_saved" }), [
    { id: "v_saved", name: "v_saved" },
  ]);
  assert.deepEqual(elevenLabsInitialVoices({}), []);

  const voices = [
    { id: "v_1", name: "Voice One" },
    { id: "v_2", name: "Voice Two" },
  ];
  assert.equal(nextElevenLabsVoiceId(voices, "v_2"), "v_2");
  assert.equal(nextElevenLabsVoiceId(voices, "missing"), "v_1");
  assert.equal(nextElevenLabsVoiceId([], "missing"), "");
  assert.equal(elevenLabsVoiceName(voices, "v_2", "Fallback"), "Voice Two");
  assert.equal(elevenLabsVoiceName(voices, "missing", "Fallback"), "Fallback");
});

test("ElevenLabs setup request builders target voice, save, and preview routes", () => {
  assert.deepEqual(elevenLabsSetupRequest("voices", { apiKey: " key " }), {
    url: "/api/tts/voices",
    method: "POST",
    body: { apiKey: " key " },
  });

  assert.deepEqual(elevenLabsSetupRequest("save", {
    apiKey: "key",
    voiceId: "v_1",
    voiceName: "Voice One",
    modelId: "eleven_flash_v2_5",
    telegramAutoSend: true,
    enabled: true,
  }), {
    url: "/api/tts",
    method: "PATCH",
    body: {
      apiKey: "key",
      voiceId: "v_1",
      voiceName: "Voice One",
      modelId: "eleven_flash_v2_5",
      telegramAutoSend: true,
      enabled: true,
    },
  });

  assert.deepEqual(elevenLabsSetupRequest("preview", { voiceId: "v_1" }), {
    url: "/api/tts/preview",
    method: "POST",
    body: {
      apiKey: "",
      voiceId: "v_1",
      modelId: ELEVENLABS_DEFAULT_MODEL,
      text: ELEVENLABS_PREVIEW_TEXT,
    },
  });
  assert.throws(() => elevenLabsSetupRequest("nope"), /Unknown ElevenLabs setup action/);
});

test("ElevenLabs setup readiness and messages guard incomplete audio saves", () => {
  assert.deepEqual(elevenLabsSaveReadiness({ voiceId: "v_1" }), { canSave: true, error: "" });
  assert.deepEqual(elevenLabsSaveReadiness({ apiKey: "key" }), { canSave: true, error: "" });
  assert.deepEqual(elevenLabsSaveReadiness({ apiKeySaved: true }), { canSave: true, error: "" });
  assert.deepEqual(elevenLabsSaveReadiness({}), {
    canSave: false,
    error: "Choose a voice or detect voices before saving ElevenLabs audio.",
  });

  assert.equal(elevenLabsSetupMessageTone("ElevenLabs audio saved."), "ok-text");
  assert.equal(elevenLabsSetupMessageTone("Detected 2 voices."), "ok-text");
  assert.equal(elevenLabsSetupMessageTone("Preview generated."), "ok-text");
  assert.equal(elevenLabsSetupMessageTone("Missing ElevenLabs API key"), "warn-text");
});

test("server ElevenLabs voice normalization filters unusable API entries", () => {
  assert.deepEqual(normalizeElevenLabsVoices({
    voices: [
      { voice_id: "v_1", name: "Voice One", category: "generated", preview_url: "https://example.test/v1.mp3" },
      { voice_id: "", name: "Missing ID" },
      { voice_id: "v_2", name: "" },
    ],
  }), [
    { id: "v_1", name: "Voice One", category: "generated", previewUrl: "https://example.test/v1.mp3" },
  ]);
});

test("server TTS settings patch plan trims inputs and guards enabled audio", () => {
  assert.deepEqual(ttsSettingsPatchPlan({
    enabled: true,
    voiceId: " v_1 ",
    voiceName: " Voice One ",
    modelId: " eleven_flash_v2_5 ",
    telegramAutoSend: true,
  }, {}, { hasKey: true }), {
    provider: "elevenlabs",
    voiceId: "v_1",
    voiceName: "Voice One",
    modelId: "eleven_flash_v2_5",
    telegramAutoSend: true,
    enabled: true,
    lastError: "",
    auditNote: "ElevenLabs TTS enabled/updated",
  });

  assert.equal(ttsSettingsPatchPlan({ enabled: true, voiceId: "" }, {}, { hasKey: true }).lastError, "Missing ElevenLabs API key or voice");
  assert.equal(ttsSettingsPatchPlan({ enabled: true, voiceId: "v_1" }, {}, { hasKey: false }).lastError, "Missing ElevenLabs API key or voice");
  assert.equal(ttsSettingsPatchPlan({ enabled: false, voiceId: "" }, {}, { hasKey: false }).lastError, "");
  assert.equal(ttsSettingsPatchPlan({}, { model_id: "saved_model", telegram_auto_send: 1, enabled: 1, voice_id: "saved_voice" }, { hasKey: true }).modelId, "saved_model");
});
