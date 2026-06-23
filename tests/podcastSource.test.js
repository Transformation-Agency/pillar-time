import assert from "node:assert/strict";
import test from "node:test";
import {
  podcastResolvePatch,
  podcastTranscriptionAvailable,
  podcastTranscriptionNotice,
} from "../src/podcastSource.js";
import {
  cleanPodcastSearchTerm,
  parsePodcastRss,
  podcastDuplicateResult,
  podcastEpisodeCandidates,
  podcastNoEpisodeConfig,
  podcastNoEpisodeResult,
  spotifyTitleCandidates,
} from "../server/podcastSource.js";

const samplePodcastRss = `<?xml version="1.0"?>
<rss><channel>
  <title><![CDATA[The Useful Show]]></title>
  <item>
    <title><![CDATA[Today & Tomorrow]]></title>
    <guid>episode-1</guid>
    <link>https://example.com/episodes/1</link>
    <pubDate>Mon, 22 Jun 2026 14:00:00 GMT</pubDate>
    <description><![CDATA[Useful <b>context</b> &amp; analysis]]></description>
    <enclosure url="https://cdn.example.com/episode-1.mp3?token=a&amp;b=c" type="audio/mpeg" length="12345" />
  </item>
  <item>
    <title>No audio item</title>
    <guid>episode-2</guid>
    <pubDate>Mon, 22 Jun 2026 15:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

test("podcast transcription availability requires audio tooling plus STT or ready cloud fallback", () => {
  assert.equal(podcastTranscriptionAvailable({ ffmpeg: { available: false }, stt: { available: true } }), false);
  assert.equal(podcastTranscriptionAvailable({ ffmpeg: { available: true }, stt: { available: true } }), true);
  assert.equal(podcastTranscriptionAvailable({
    ffmpeg: { available: true },
    stt: { available: false },
    model: { provider: "openai", status: "ready" },
  }), true);
  assert.equal(podcastTranscriptionAvailable({
    ffmpeg: { available: true },
    stt: { available: false },
    model: { provider: "anthropic", status: "ready" },
  }), false);
});

test("podcast transcription notice matches enabled and disabled states", () => {
  assert.deepEqual(podcastTranscriptionNotice(true), {
    title: "Podcast transcription available",
    body: "Podcast audio can be split with FFmpeg and transcribed with local Whisper or your configured cloud fallback.",
    warn: false,
  });
  assert.deepEqual(podcastTranscriptionNotice(false), {
    title: "Podcast transcription unavailable",
    body: "Set up FFmpeg plus local Whisper STT or an OpenAI-compatible transcription endpoint before podcast audio can be transcribed.",
    warn: true,
  });
});

test("podcast Spotify resolve patch fills RSS metadata and preserves an explicit transcription opt-out", () => {
  const result = {
    podcastTitle: "The Useful Show",
    author: "Useful Media",
    feedUrl: "https://example.com/feed.xml",
    spotifyTitle: "Listen to The Useful Show | Podcast on Spotify",
    confidence: "high",
  };
  assert.deepEqual(podcastResolvePatch({
    currentForm: { name: "", config: { spotifyUrl: "https://open.spotify.com/show/abc" } },
    result,
  }), {
    name: "The Useful Show",
    config: {
      spotifyUrl: "https://open.spotify.com/show/abc",
      mode: "spotify",
      feedUrl: "https://example.com/feed.xml",
      podcastTitle: "The Useful Show",
      podcastAuthor: "Useful Media",
      spotifyTitle: "Listen to The Useful Show | Podcast on Spotify",
      resolverConfidence: "high",
      transcribeNewEpisodes: true,
    },
  });
  assert.equal(podcastResolvePatch({
    currentForm: { name: "Custom Name", config: { transcribeNewEpisodes: false } },
    result,
  }).config.transcribeNewEpisodes, false);
});

test("podcast Spotify title cleanup produces fallback search terms", () => {
  assert.equal(cleanPodcastSearchTerm("Listen to Episode Name - The Show | Podcast on Spotify"), "Episode Name - The Show");
  assert.deepEqual(spotifyTitleCandidates("Listen to Episode Name - The Show | Podcast on Spotify"), [
    "Episode Name - The Show",
    "The Show",
    "Episode Name",
  ]);
});

test("podcast RSS parser keeps only episodes with audio and decodes channel and enclosure metadata", () => {
  const [episode] = parsePodcastRss(samplePodcastRss);
  assert.equal(episode.channelTitle, "The Useful Show");
  assert.equal(episode.title, "Today & Tomorrow");
  assert.equal(episode.guid, "episode-1");
  assert.equal(episode.link, "https://example.com/episodes/1");
  assert.equal(episode.pubDate, "Mon, 22 Jun 2026 14:00:00 GMT");
  assert.equal(episode.description, "Useful <b>context</b> & analysis");
  assert.equal(episode.audioUrl, "https://cdn.example.com/episode-1.mp3?token=a&b=c");
  assert.equal(episode.audioType, "audio/mpeg");
  assert.equal(episode.audioLength, 12345);
});

test("podcast episode candidates use latest mode or injected today predicate", () => {
  const episodes = [
    { title: "Today", pubDate: "Mon, 22 Jun 2026 14:00:00 GMT" },
    { title: "Older", pubDate: "Sun, 21 Jun 2026 14:00:00 GMT" },
  ];
  assert.deepEqual(podcastEpisodeCandidates({ episodes, mode: "latest", episodeIsToday: () => false }), episodes);
  assert.deepEqual(podcastEpisodeCandidates({
    episodes,
    mode: "today",
    episodeIsToday: (episode) => episode.title === "Today",
  }), [episodes[0]]);
});

test("podcast no-episode and duplicate results expose deterministic fetch state", () => {
  const fetchedAt = "2026-06-22T16:00:00.000Z";
  assert.deepEqual(podcastNoEpisodeConfig({
    config: { mode: "feed", feedUrl: "https://example.com/feed.xml" },
    fetchedAt,
    episodes: [{ title: "Older" }],
  }), {
    mode: "feed",
    feedUrl: "https://example.com/feed.xml",
    lastFetchedAt: fetchedAt,
    lastFetchCacheStatus: "no-episode",
    lastFetchedCount: 1,
    lastInsertedCount: 0,
  });
  assert.deepEqual(podcastNoEpisodeResult({ mode: "today", episodes: [{ title: "Older" }] }), {
    ok: true,
    transcribed: false,
    reason: "No podcast episode published today was found.",
    episodesChecked: 1,
  });
  assert.deepEqual(podcastDuplicateResult({
    episode: { title: "Today", pubDate: "Mon, 22 Jun 2026 14:00:00 GMT", audioUrl: "https://cdn.example.com/today.mp3" },
    documentId: "doc-1",
  }), {
    ok: true,
    transcribed: false,
    skipped: true,
    reason: "Episode was already transcribed.",
    episode: { title: "Today", pubDate: "Mon, 22 Jun 2026 14:00:00 GMT", audioUrl: "https://cdn.example.com/today.mp3" },
    documentId: "doc-1",
    words: 0,
    chunks: 0,
    audioBytes: 0,
  });
});
