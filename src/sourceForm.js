export const sourceDefinitions = {
  Web: {
    credential: "No API key. Use for public pages; the fetch adapter should use readability/extraction.",
    modes: {
      page: { label: "Single page", fields: [["url", "URL", "https://example.com/report"]] },
      search: { label: "Site/topic search", fields: [["url", "Site URL", "https://example.com"], ["query", "Search/topic terms", "AI policy OR compute"]] },
    },
  },
  RSS: {
    credential: "No API key. Watches a feed URL and filters optional keywords.",
    modes: {
      feed: { label: "Feed URL", fields: [["feedUrl", "Feed URL", "https://site.com/feed.xml"], ["keywords", "Optional keywords", "compute, policy, AI"]] },
    },
  },
  Reddit: {
    credential: "No key is usually needed for public subreddit/user/page reads via public web or JSON-style collectors. Reddit OAuth is the more durable path for higher-volume, private, or policy-compliant API use.",
    modes: {
      subreddit: { label: "Public subreddit posts", fields: [["subreddits", "Subreddits", "geopolitics, MachineLearning"], ["sort", "Sort", "new | hot | top"], ["keywords", "Optional keywords", "AI chips OR China"]] },
      user: { label: "Public user posts/comments", fields: [["username", "Username", "spez"], ["include", "Include", "posts | comments | both"]] },
      search: { label: "Public Reddit search", fields: [["query", "Search query", "\"frontier model\" OR compute"], ["scope", "Scope", "all Reddit or subreddit list"], ["sort", "Sort", "relevance | new | top"]] },
    },
  },
  X: {
    credential: "Official X API access requires a token. X sources always run in locked quick mode: max 10 posts, no replies, no retweets, and a 1-hour cache to avoid burning credits.",
    modes: {
      search: { label: "Quick recent search", fields: [["query", "Search query", "(AI OR compute) lang:en"]] },
    },
  },
  YouTube: {
    credential: "No key is needed for channel RSS/public page watching. The YouTube Data API key is useful for official search, richer metadata, playlist details, and quota-managed reliability.",
    modes: {
      channel: { label: "Channel RSS/public uploads", fields: [["channel", "Channel ID or handle", "@lexfridman"], ["keywords", "Optional keywords", "AI, geopolitics"]] },
      playlist: { label: "Public playlist / API playlist", fields: [["playlistId", "Playlist ID", "PL..."]] },
      search: { label: "YouTube keyword search", fields: [["query", "Search query", "AI infrastructure"], ["order", "Order", "date | relevance | viewCount"]] },
    },
  },
  Podcast: {
    credential: "No API key for standard podcast RSS. Spotify links are resolved to the show's public RSS feed when possible; transcription uses local Whisper STT when available or an OpenAI-compatible fallback.",
    modes: {
      feed: { label: "Podcast RSS", fields: [["feedUrl", "RSS feed URL", "https://podcast.com/feed.xml"], ["keywords", "Optional episode keywords", "AI, strategy"]] },
      spotify: { label: "Spotify link -> RSS", fields: [["spotifyUrl", "Spotify episode/show URL", "https://open.spotify.com/episode/..."], ["feedUrl", "Resolved RSS feed", "Click Resolve RSS"], ["keywords", "Optional episode keywords", "AI, strategy"]] },
    },
  },
  Calendar: {
    credential: "Requires Google Calendar OAuth. Pillar Time reads your agenda and can create approved schedule blocks around existing events.",
    modes: {
      google: { label: "Selected Google calendars", fields: [] },
    },
  },
  Newsletter: {
    credential: "Usually RSS/archive URL based. Private inbox newsletters need a separate email integration, not a generic locator.",
    modes: {
      feed: { label: "RSS/archive", fields: [["feedUrl", "Feed or archive URL", "https://newsletter.com/feed"], ["keywords", "Optional keywords", "markets, compute"]] },
      archive: { label: "Public archive page", fields: [["url", "Archive URL", "https://newsletter.com/archive"], ["keywords", "Optional keywords", "China, AI"]] },
    },
  },
  TikTok: {
    credential: "Official TikTok research/content APIs are gated. Public/browser collection may work for visible accounts/search pages, but expect fragility, login walls, and rate limiting.",
    modes: {
      research_search: { label: "Public/API keyword search", fields: [["query", "Search query", "AI regulation"], ["region", "Region", "US | EU"]] },
      account: { label: "Public account watch", fields: [["username", "Username", "@creator"]] },
    },
  },
};

export function defaultConfig(type) {
  const definition = sourceDefinitions[type] || sourceDefinitions.RSS;
  const mode = Object.keys(definition.modes)[0];
  return { mode };
}

export function sourceLocator(type, config = {}) {
  const mode = config.mode;
  if (type === "Calendar") return config.calendarId === "primary" ? "primary" : "selected";
  if (type === "Reddit") {
    if (mode === "subreddit") return `subreddits:${config.subreddits || ""}`;
    if (mode === "user") return `u/${config.username || ""}`;
    return `search:${config.query || ""}`;
  }
  if (type === "X") return mode === "search" ? `search:${config.query || ""}` : config.handle || "";
  if (type === "YouTube") return config.channel || config.playlistId || `search:${config.query || ""}`;
  if (type === "Podcast" && mode === "spotify") return config.feedUrl || config.spotifyUrl || "";
  return config.feedUrl || config.url || config.query || config.username || "";
}

export function sourceSubmitRequest({ form = {}, editingSource = null, mode } = {}) {
  const effectiveMode = mode || form.config?.mode || defaultConfig(form.type || "RSS").mode;
  const config = { ...(form.config || {}), mode: effectiveMode };
  const locator = sourceLocator(form.type || "RSS", config);
  const endpoint = editingSource ? `/api/sources/${editingSource.id}` : "/api/sources";
  const method = editingSource ? "PATCH" : "POST";
  return {
    endpoint,
    method,
    payload: { ...form, locator, config },
  };
}
