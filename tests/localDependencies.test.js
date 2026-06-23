import test from "node:test";
import assert from "node:assert/strict";

import {
  ffmpegInstallDecision,
  sttModelInstallDecision,
} from "../server/localDependencies.js";
import {
  localDependencyRuntimeRequest,
  localDependencySettingsView,
} from "../src/localDependencies.js";

test("local dependency settings view reports FFmpeg and Whisper readiness", () => {
  const view = localDependencySettingsView({
    ffmpeg: { available: true, path: "/opt/homebrew/bin/ffmpeg", homebrewAvailable: true },
    stt: { available: true, binaryAvailable: true, modelAvailable: true, modelName: "base.en" },
  });

  assert.deepEqual(view.summary, { tone: "ok", label: "Ready" });
  assert.equal(view.ffmpeg.badgeLabel, "Installed");
  assert.equal(view.ffmpeg.pathLabel, "/opt/homebrew/bin/ffmpeg");
  assert.equal(view.ffmpeg.showInstall, false);
  assert.equal(view.stt.badgeLabel, "Ready");
  assert.equal(view.stt.modelLabel, "base.en");
  assert.equal(view.stt.showModelDownload, false);
});

test("Whisper model download is only offered after the binary exists", () => {
  const missingBinary = localDependencySettingsView({
    stt: { available: false, binaryAvailable: false, modelAvailable: false },
  });
  assert.equal(missingBinary.stt.showModelDownload, false);
  assert.equal(missingBinary.stt.showBinaryHint, true);

  const missingModel = localDependencySettingsView({
    stt: { available: false, binaryAvailable: true, modelAvailable: false },
  });
  assert.equal(missingModel.stt.showModelDownload, true);
  assert.equal(missingModel.stt.showBinaryHint, false);
});

test("FFmpeg settings view offers Homebrew install only for installable missing FFmpeg", () => {
  const view = localDependencySettingsView({
    ffmpeg: { available: false, installable: true, homebrewAvailable: false },
  });
  assert.equal(view.summary.label, "Needs setup");
  assert.equal(view.ffmpeg.badgeLabel, "Unavailable");
  assert.equal(view.ffmpeg.showInstall, true);
  assert.equal(view.ffmpeg.showHomebrewHint, true);

  const notInstallable = localDependencySettingsView({
    ffmpeg: { available: false, installable: false, homebrewAvailable: true },
  });
  assert.equal(notInstallable.ffmpeg.showInstall, false);
});

test("local dependency runtime requests target the expected API routes", () => {
  assert.deepEqual(localDependencyRuntimeRequest("checkFfmpeg"), {
    url: "/api/runtime/ffmpeg",
    method: "GET",
    body: null,
  });
  assert.deepEqual(localDependencyRuntimeRequest("installFfmpeg"), {
    url: "/api/runtime/ffmpeg/install",
    method: "POST",
    body: { consent: true },
  });
  assert.deepEqual(localDependencyRuntimeRequest("checkStt"), {
    url: "/api/runtime/stt",
    method: "GET",
    body: null,
  });
  assert.deepEqual(localDependencyRuntimeRequest("installSttModel"), {
    url: "/api/runtime/stt/model/install",
    method: "POST",
    body: {},
  });
  assert.throws(() => localDependencyRuntimeRequest("nope"), /Unknown local dependency action/);
});

test("server local dependency decisions guard model and FFmpeg installs", () => {
  assert.deepEqual(sttModelInstallDecision({ binaryAvailable: false, message: "Missing binary." }), {
    allowed: false,
    message: "Missing binary.",
  });
  assert.deepEqual(sttModelInstallDecision({ binaryAvailable: true, modelAvailable: true }), {
    allowed: false,
    alreadyInstalled: true,
    message: "Whisper model is already installed.",
  });
  assert.equal(sttModelInstallDecision({ binaryAvailable: true, modelAvailable: false }).allowed, true);

  assert.equal(ffmpegInstallDecision({ status: {}, isDesktop: false, platform: "linux" }).action, "unsupported");
  assert.equal(ffmpegInstallDecision({ status: { available: true }, isDesktop: true, platform: "darwin" }).action, "alreadyInstalled");
  assert.equal(ffmpegInstallDecision({ status: { available: false, homebrewAvailable: false }, isDesktop: true, platform: "darwin" }).action, "openHomebrewInstaller");
  assert.equal(ffmpegInstallDecision({ status: { available: false, homebrewAvailable: true }, isDesktop: true, platform: "darwin" }).action, "brewInstall");
});
