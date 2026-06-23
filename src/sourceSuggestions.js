export function sourcePrerequisites(source = {}, state = {}) {
  const notes = [];
  if (source.type === "Calendar" && state.connectors?.googleCalendar?.status !== "ready") {
    notes.push({
      key: "googleCalendar",
      blocking: true,
      label: "Needs Google Calendar",
      body: "Connect Google Calendar before this source can fetch today's agenda.",
    });
  }
  if (source.type === "X" && state.connectors?.x?.status !== "ready") {
    notes.push({
      key: "x",
      blocking: true,
      label: "Needs X API token",
      body: "Set up an X developer Bearer Token before this source can fetch posts.",
    });
  }
  if (source.type === "Podcast" && source.config?.transcribeNewEpisodes !== false) {
    if (state.runtime?.ffmpeg?.available === false) {
      notes.push({
        key: "ffmpeg",
        blocking: true,
        label: "Needs FFmpeg",
        body: "Install FFmpeg before long podcast audio can be split and converted for transcription.",
      });
    }
    const localSttReady = state.runtime?.stt?.available;
    const transcriptionModelReady = localSttReady || (["openai", "custom"].includes(state.model?.provider) && state.model?.status === "ready");
    if (!transcriptionModelReady) {
      notes.push({
        key: "transcriptionModel",
        blocking: true,
        label: "Needs speech-to-text",
        body: "Podcast transcription needs local Whisper STT or an OpenAI-compatible transcription endpoint.",
      });
    }
  }
  return notes;
}

export function sourceReadyForOnboarding(source = {}, state = {}) {
  return sourcePrerequisites(source, state).every((note) => !note.blocking);
}

export function sourcePrerequisiteKeys(source = {}, state = {}) {
  return [...new Set(sourcePrerequisites(source, state).filter((note) => note.blocking).map((note) => note.key))];
}

export function selectedSourceSuggestions(suggestions = [], selectedIds = new Set()) {
  return suggestions.filter((source) => selectedIds.has(source.id));
}

export function addSelectedSourcesDecision({ suggestions = [], selectedIds = new Set(), state = {} }) {
  const chosen = selectedSourceSuggestions(suggestions, selectedIds);
  if (!chosen.length) {
    return { action: "message", message: "Select at least one source.", chosen, blocked: [], ready: [] };
  }
  const blocked = chosen.filter((source) => !sourceReadyForOnboarding(source, state));
  if (blocked.length) {
    return {
      action: "access",
      message: `${blocked.length} selected source${blocked.length === 1 ? "" : "s"} need setup first.`,
      chosen,
      blocked,
      ready: chosen.filter((source) => sourceReadyForOnboarding(source, state)),
      pendingIds: new Set(chosen.map((source) => source.id)),
    };
  }
  return { action: "save", message: "", chosen, blocked: [], ready: chosen };
}

export function continueAfterAccessDecision({ pendingSources = [], state = {} }) {
  const ready = pendingSources.filter((source) => sourceReadyForOnboarding(source, state));
  const blocked = pendingSources.filter((source) => !sourceReadyForOnboarding(source, state));
  if (blocked.length) {
    return {
      action: "message",
      ready,
      blocked,
      message: `${blocked.length} selected source${blocked.length === 1 ? "" : "s"} still need setup. Skip those sources or finish setup to continue.`,
    };
  }
  return { action: "save", ready, blocked: [], message: "" };
}

export function skipPrerequisiteSelection({ pendingSources = [], state = {}, key }) {
  const shouldSkip = (source) => {
    const keys = sourcePrerequisiteKeys(source, state);
    if (key === "transcription") return keys.includes("ffmpeg") || keys.includes("transcriptionModel");
    return keys.includes(key);
  };
  const remaining = pendingSources.filter((source) => !shouldSkip(source));
  return {
    remaining,
    nextIds: new Set(remaining.map((source) => source.id)),
    message: `Skipped ${key === "x" ? "X" : "transcription-dependent"} sources.`,
    returnToSources: !remaining.length,
  };
}

export function sourceCreateRequest(source = {}) {
  return {
    url: "/api/sources",
    method: "POST",
    body: {
      ...source,
      config: source.config,
    },
  };
}
