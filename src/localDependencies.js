export function localDependencySettingsView({ ffmpeg = {}, stt = {} } = {}) {
  const ffmpegAvailable = !!ffmpeg?.available;
  const sttAvailable = !!stt?.available;
  const sttBinaryAvailable = !!stt?.binaryAvailable;
  const sttModelAvailable = !!stt?.modelAvailable;

  return {
    summary: {
      tone: ffmpegAvailable && sttAvailable ? "ok" : "warn",
      label: ffmpegAvailable && sttAvailable ? "Ready" : "Needs setup",
    },
    stt: {
      badgeTone: sttAvailable ? "ok" : "warn",
      badgeLabel: sttAvailable ? "Ready" : "Unavailable",
      noticeWarn: !sttAvailable,
      headline: sttAvailable ? "Local speech-to-text is enabled" : "Local speech-to-text is disabled",
      modelLabel: stt?.modelName || "tiny.en",
      showModelDownload: sttBinaryAvailable && !sttModelAvailable,
      showBinaryHint: !sttBinaryAvailable,
    },
    ffmpeg: {
      badgeTone: ffmpegAvailable ? "ok" : "warn",
      badgeLabel: ffmpegAvailable ? "Installed" : "Unavailable",
      noticeWarn: !ffmpegAvailable,
      headline: ffmpegAvailable ? "Podcast transcription is enabled" : "Podcast transcription is disabled",
      pathLabel: ffmpeg?.path || "Not found",
      showInstall: !ffmpegAvailable && !!ffmpeg?.installable,
      showHomebrewHint: !ffmpegAvailable && !ffmpeg?.homebrewAvailable,
    },
  };
}

export function localDependencyRuntimeRequest(kind) {
  if (kind === "checkFfmpeg") return { url: "/api/runtime/ffmpeg", method: "GET", body: null };
  if (kind === "installFfmpeg") return { url: "/api/runtime/ffmpeg/install", method: "POST", body: { consent: true } };
  if (kind === "checkStt") return { url: "/api/runtime/stt", method: "GET", body: null };
  if (kind === "installSttModel") return { url: "/api/runtime/stt/model/install", method: "POST", body: {} };
  throw new Error(`Unknown local dependency action: ${kind || "missing"}`);
}
