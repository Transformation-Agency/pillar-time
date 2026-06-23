export function sttModelInstallDecision(status = {}) {
  if (!status?.binaryAvailable) {
    return {
      allowed: false,
      message: status?.message || "Install whisper.cpp before downloading a local Whisper model.",
    };
  }
  if (status?.modelAvailable) {
    return {
      allowed: false,
      alreadyInstalled: true,
      message: "Whisper model is already installed.",
    };
  }
  return {
    allowed: true,
    message: "Whisper model can be downloaded.",
  };
}

export function ffmpegInstallDecision({ status = {}, isDesktop = false, platform = process.platform } = {}) {
  if (!isDesktop || platform !== "darwin") {
    return {
      action: "unsupported",
      allowed: false,
      message: "One-click FFmpeg install is only available in the macOS desktop app. Install FFmpeg with your system package manager.",
    };
  }
  if (status?.available) {
    return {
      action: "alreadyInstalled",
      allowed: false,
      message: "FFmpeg is already installed.",
    };
  }
  if (!status?.homebrewAvailable) {
    return {
      action: "openHomebrewInstaller",
      allowed: true,
      message: "Opened the Homebrew and FFmpeg installer in Terminal. Return here and click Re-check when it finishes.",
    };
  }
  return {
    action: "brewInstall",
    allowed: true,
    message: "Install FFmpeg with Homebrew.",
  };
}
