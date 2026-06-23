import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  briefAudioButtonState,
  briefAudioPlayingForEvent,
  briefAudioRestartPlan,
  briefAudioSelectionState,
} from "../src/briefAudio.js";
import {
  briefAudioArtifact,
  briefAudioFilePath,
  briefAudioGenerationPlan,
  briefAudioTextFromArtifact,
  storedBriefAudio,
} from "../server/briefAudio.js";

test("brief audio button stays disabled until TTS is ready and reflects generation/playback state", () => {
  assert.deepEqual(briefAudioButtonState({ ttsStatus: "pending credentials" }), {
    disabled: true,
    label: "Generate audio",
    restartDisabled: true,
    showTtsSetupNotice: true,
  });

  assert.equal(briefAudioButtonState({ ttsStatus: "ready", audioBusy: true }).label, "Generating...");
  assert.equal(briefAudioButtonState({ ttsStatus: "ready", audioPlaying: true, audioUrl: "/api/audio/brief.mp3" }).label, "Pause");
  assert.equal(briefAudioButtonState({ ttsStatus: "ready", audioUrl: "/api/audio/brief.mp3" }).label, "Play audio");
  assert.equal(briefAudioButtonState({ ttsStatus: "ready" }).disabled, false);
});

test("brief audio selection and element events reset and follow playback state", () => {
  assert.deepEqual(briefAudioSelectionState({
    id: "run-1",
    artifact: { audio: { url: "/api/audio/brief-run-1.mp3" } },
  }), {
    audioUrl: "/api/audio/brief-run-1.mp3",
    audioMessage: "",
    audioPlaying: false,
  });

  assert.equal(briefAudioPlayingForEvent("play", false), true);
  assert.equal(briefAudioPlayingForEvent("pause", true), false);
  assert.equal(briefAudioPlayingForEvent("ended", true), false);
  assert.equal(briefAudioPlayingForEvent("timeupdate", true), true);
});

test("brief audio restart resets time and only plans playback when audio exists", () => {
  assert.equal(briefAudioRestartPlan({ audioUrl: "" }), null);
  assert.deepEqual(briefAudioRestartPlan({ audioUrl: "/api/audio/brief.mp3", currentTime: 42 }), {
    audioUrl: "/api/audio/brief.mp3",
    currentTime: 0,
    shouldPlay: true,
    wasPastStart: true,
  });
});

test("brief audio text removes markdown, generated stamp, links, urls, and caps TTS payload", () => {
  const text = briefAudioTextFromArtifact({
    onePageBrief: [
      "# Morning Brief",
      "Generated: 2026-06-22",
      "## Focus",
      "Read [source](https://example.com/source) and https://example.com/raw today.",
    ].join("\n"),
  });

  assert.equal(text, "Morning Brief Focus Read source and today.");
  assert.equal(briefAudioTextFromArtifact({}, () => "x".repeat(9010)).length, 9000);
});

test("brief audio generation plan reuses stored MP3 URL or prepares synthesis and artifact storage", () => {
  const cached = { url: "/api/audio/brief-run-1.mp3", fileName: "brief-run-1.mp3" };
  assert.equal(storedBriefAudio({ audio: cached }), cached);
  assert.equal(storedBriefAudio({ audio: { url: "/api/audio/missing-name.mp3" } }), null);

  assert.deepEqual(briefAudioGenerationPlan(null), {
    status: "not-found",
    error: "Workflow run not found",
  });
  assert.deepEqual(briefAudioGenerationPlan({ id: "run-1", artifact: { audio: cached } }), {
    status: "cached",
    audio: cached,
  });
  assert.deepEqual(briefAudioGenerationPlan({ id: "run-2", artifact: { onePageBrief: "# Ready" } }), {
    status: "generate",
    text: "Ready",
    filenamePrefix: "brief-run-2",
  });
  assert.deepEqual(briefAudioArtifact({ title: "Brief" }, cached), {
    title: "Brief",
    audio: cached,
  });
});

test("brief audio file path only serves existing basename MP3 files", () => {
  const audioDir = "/tmp/pillar-audio";
  const existing = new Set([path.join(audioDir, "brief.mp3")]);
  const exists = (filePath) => existing.has(filePath);

  assert.deepEqual(briefAudioFilePath({ audioDir, fileName: "brief.mp3", exists, pathApi: path }), {
    fileName: "brief.mp3",
    filePath: path.join(audioDir, "brief.mp3"),
  });
  assert.deepEqual(briefAudioFilePath({ audioDir, fileName: "../brief.mp3", exists, pathApi: path }), {
    fileName: "brief.mp3",
    filePath: path.join(audioDir, "brief.mp3"),
  });
  assert.equal(briefAudioFilePath({ audioDir, fileName: "brief.wav", exists, pathApi: path }), null);
  assert.equal(briefAudioFilePath({ audioDir, fileName: "missing.mp3", exists, pathApi: path }), null);
});
