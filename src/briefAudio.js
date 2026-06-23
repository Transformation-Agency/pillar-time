export function briefAudioButtonState({ audioBusy = false, audioPlaying = false, audioUrl = "", ttsStatus = "" } = {}) {
  const ttsReady = ttsStatus === "ready";
  return {
    disabled: !!audioBusy || !ttsReady,
    label: audioBusy ? "Generating..." : audioPlaying ? "Pause" : audioUrl ? "Play audio" : "Generate audio",
    restartDisabled: !!audioBusy || !ttsReady,
    showTtsSetupNotice: !ttsReady,
  };
}

export function briefAudioSelectionState(run) {
  return {
    audioUrl: run?.artifact?.audio?.url || "",
    audioMessage: "",
    audioPlaying: false,
  };
}

export function briefAudioPlayingForEvent(eventType, current = false) {
  if (eventType === "play") return true;
  if (["pause", "ended", "error"].includes(eventType)) return false;
  return current;
}

export function briefAudioRestartPlan({ audioUrl = "", currentTime = 0 } = {}) {
  if (!audioUrl) return null;
  return {
    audioUrl,
    currentTime: 0,
    shouldPlay: true,
    wasPastStart: Number(currentTime || 0) > 0,
  };
}
