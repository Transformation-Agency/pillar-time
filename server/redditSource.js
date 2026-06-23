export function redditCredentialData({ storedData = {}, rowEnabled = false, envClientId = "", envClientSecret = "" } = {}) {
  const data = storedData || {};
  const clientId = data.clientId || envClientId || "";
  const clientSecret = data.clientSecret || envClientSecret || "";
  return {
    enabled: !!rowEnabled || !!envClientId,
    data: {
      ...data,
      clientId,
      clientSecret,
      grantType: data.grantType || (clientSecret ? "client_credentials" : "installed_client"),
      deviceId: data.deviceId || "DO_NOT_TRACK_THIS_DEVICE",
    },
  };
}

export function redditTokenRequestPlan(data = {}) {
  if (!data.clientId) throw new Error("Reddit client ID is missing.");
  const grantType = data.grantType === "installed_client" ? "installed_client" : "client_credentials";
  const body = new URLSearchParams();
  if (grantType === "installed_client") {
    body.set("grant_type", "https://oauth.reddit.com/grants/installed_client");
    body.set("device_id", String(data.deviceId || "DO_NOT_TRACK_THIS_DEVICE"));
  } else {
    body.set("grant_type", "client_credentials");
  }
  return {
    grantType,
    url: "https://www.reddit.com/api/v1/access_token",
    headers: {
      Authorization: `Basic ${Buffer.from(`${data.clientId}:${data.clientSecret || ""}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "PillarTime/0.1 by operator",
    },
    body,
  };
}

function redditLimit(config = {}) {
  return Math.max(5, Math.min(25, Number(config.maxItems || 10)));
}

function redditSubreddit(source = {}) {
  const config = source.config || {};
  return String(config.subreddits || source.locator || "").split(",")[0].trim().replace(/^r\//, "").replace(/^subreddits:/, "");
}

function redditSort(config = {}) {
  return ["hot", "top"].includes(config.sort) ? config.sort : "new";
}

export function redditOAuthPathForSource(source = {}) {
  const config = source.config || {};
  const limit = redditLimit(config);
  if (config.mode === "search") {
    const params = new URLSearchParams({ q: config.query || source.locator, sort: config.sort || "new", t: "day", limit: String(limit), raw_json: "1" });
    return `/search.json?${params}`;
  }
  if (config.mode === "user") {
    const user = String(config.username || source.locator || "").replace(/^u\//, "").replace(/^@/, "");
    return `/user/${encodeURIComponent(user)}/submitted.json?limit=${limit}&raw_json=1`;
  }
  return `/r/${encodeURIComponent(redditSubreddit(source))}/${redditSort(config)}.json?limit=${limit}&raw_json=1`;
}

export function redditJsonUrlForSource(source = {}) {
  const config = source.config || {};
  const limit = redditLimit(config);
  if (config.mode === "search") {
    const params = new URLSearchParams({ q: config.query || source.locator, sort: config.sort || "new", t: "day", limit: String(limit), raw_json: "1" });
    return `https://www.reddit.com/search.json?${params}`;
  }
  if (config.mode === "user") {
    const user = String(config.username || source.locator || "").replace(/^u\//, "").replace(/^@/, "");
    return `https://www.reddit.com/user/${encodeURIComponent(user)}/submitted.json?limit=${limit}&raw_json=1`;
  }
  return `https://www.reddit.com/r/${encodeURIComponent(redditSubreddit(source))}/${redditSort(config)}.json?limit=${limit}&raw_json=1`;
}

export function redditRssUrlForSource(source = {}) {
  const config = source.config || {};
  if (config.mode === "search") {
    const params = new URLSearchParams({ q: config.query || source.locator, sort: config.sort || "new", t: "day" });
    return `https://www.reddit.com/search.rss?${params}`;
  }
  if (config.mode === "user") {
    const user = String(config.username || source.locator || "").replace(/^u\//, "").replace(/^@/, "");
    return `https://www.reddit.com/user/${encodeURIComponent(user)}/submitted.rss`;
  }
  return `https://www.reddit.com/r/${encodeURIComponent(redditSubreddit(source))}/${redditSort(config)}.rss`;
}

export function redditPostsFromListing(payload = {}) {
  return (payload.data?.children || []).map((child) => child.data).filter(Boolean);
}

export function redditPostPublishedAt(post = {}) {
  return post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null;
}

export function redditPostBody(post = {}) {
  return [post.selftext, post.url && !String(post.url).includes("reddit.com") ? `Link: ${post.url}` : ""].filter(Boolean).join("\n");
}

export function redditPostToNormalizedItem({ source = {}, post = {}, scoreText = () => 0 } = {}) {
  const body = redditPostBody(post);
  return {
    source,
    stableId: post.name || post.id,
    canonicalUrl: `https://www.reddit.com${post.permalink || ""}`,
    title: post.title,
    body,
    publishedAt: redditPostPublishedAt(post),
    relevanceScore: scoreText(`${post.title} ${body}`, source.config?.keywords || source.config?.query),
    risingScore: Math.min(1, Math.log10(Number(post.score || 0) + Number(post.num_comments || 0) + 1) / 4),
  };
}

export function redditNextConfig({ config = {}, parsedCount = 0, todayCount = 0, inserted = 0, fetchedAt = "", mode = "" } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchedCount: parsedCount,
    lastFetchedTodayCount: todayCount,
    lastInsertedCount: inserted,
    ...(mode ? { lastFetchMode: mode } : {}),
  };
}

export function redditShouldUseRssFallback(status) {
  return status === 403 || status === 429;
}
