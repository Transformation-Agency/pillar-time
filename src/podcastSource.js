export function podcastTranscriptionAvailable({ ffmpeg = {}, stt = {}, model = {} } = {}) {
  const cloudTranscriptionReady = ["openai", "custom"].includes(model.provider) && model.status === "ready";
  return ffmpeg?.available !== false && (!!stt?.available || cloudTranscriptionReady);
}

export function podcastTranscriptionNotice(available) {
  return available
    ? {
      title: "Podcast transcription available",
      body: "Podcast audio can be split with FFmpeg and transcribed with local Whisper or your configured cloud fallback.",
      warn: false,
    }
    : {
      title: "Podcast transcription unavailable",
      body: "Set up FFmpeg plus local Whisper STT or an OpenAI-compatible transcription endpoint before podcast audio can be transcribed.",
      warn: true,
    };
}

export function podcastResolvePatch({ currentForm = {}, result = {} } = {}) {
  return {
    ...currentForm,
    name: currentForm.name || result.podcastTitle || "",
    config: {
      ...(currentForm.config || {}),
      mode: "spotify",
      feedUrl: result.feedUrl,
      podcastTitle: result.podcastTitle,
      podcastAuthor: result.author,
      spotifyTitle: result.spotifyTitle,
      resolverConfidence: result.confidence,
      transcribeNewEpisodes: currentForm.config?.transcribeNewEpisodes ?? true,
    },
  };
}
