export function decodePodcastXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

export function podcastTagValue(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodePodcastXml(match?.[1] || "");
}

export function podcastAttrValue(xml, attr) {
  const match = String(xml || "").match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return decodePodcastXml(match?.[1] || "");
}

export function cleanPodcastSearchTerm(value) {
  return String(value || "")
    .replace(/\s*\|\s*Podcast on Spotify\s*/gi, "")
    .replace(/\s*\|\s*Spotify\s*/gi, "")
    .replace(/^Listen to\s+/i, "")
    .replace(/\s+on Spotify$/i, "")
    .trim();
}

export function spotifyTitleCandidates(title) {
  const cleaned = cleanPodcastSearchTerm(title);
  const parts = cleaned.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  return [...new Set([
    cleaned,
    parts.at(-1),
    parts.length > 1 ? parts.slice(1).join(" - ") : "",
    parts[0],
  ].filter(Boolean))];
}

export function parsePodcastRss(xml) {
  const channelTitle = podcastTagValue(xml, "title");
  return [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    const enclosure = item.match(/<enclosure\b[^>]*>/i)?.[0] || "";
    return {
      title: podcastTagValue(item, "title") || "Untitled episode",
      guid: podcastTagValue(item, "guid") || podcastTagValue(item, "link") || podcastAttrValue(enclosure, "url"),
      link: podcastTagValue(item, "link"),
      pubDate: podcastTagValue(item, "pubDate"),
      description: podcastTagValue(item, "description"),
      audioUrl: podcastAttrValue(enclosure, "url"),
      audioType: podcastAttrValue(enclosure, "type") || "audio/mpeg",
      audioLength: Number(podcastAttrValue(enclosure, "length") || 0),
      channelTitle,
    };
  }).filter((episode) => episode.audioUrl);
}

export function podcastEpisodeCandidates({ episodes = [], mode = "today", episodeIsToday = () => false } = {}) {
  return mode === "latest" ? episodes : episodes.filter(episodeIsToday);
}

export function podcastNoEpisodeConfig({ config = {}, fetchedAt = "", episodes = [] } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchCacheStatus: "no-episode",
    lastFetchedCount: episodes.length,
    lastInsertedCount: 0,
  };
}

export function podcastNoEpisodeResult({ mode = "today", episodes = [] } = {}) {
  return {
    ok: true,
    transcribed: false,
    reason: mode === "latest" ? "No podcast episodes with audio were found." : "No podcast episode published today was found.",
    episodesChecked: episodes.length,
  };
}

export function podcastDuplicateResult({ episode = {}, documentId = null } = {}) {
  return {
    ok: true,
    transcribed: false,
    skipped: true,
    reason: "Episode was already transcribed.",
    episode: { title: episode.title, pubDate: episode.pubDate, audioUrl: episode.audioUrl },
    documentId,
    words: 0,
    chunks: 0,
    audioBytes: 0,
  };
}
