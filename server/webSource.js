function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripWebHtml(value = "") {
  return decodeHtml(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

export function extractWebMeta(html = "", property = "") {
  const escaped = String(property).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = String(html || "").match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).trim();
  }
  return "";
}

export function webRequestPlan(source = {}) {
  const config = source.config || {};
  const url = String(config.url || source.locator || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, skipped: true, reason: "No public web URL configured", url: "", headers: {} };
  }
  const headers = { "User-Agent": "PillarTime/0.1" };
  if (config.lastEtag) headers["If-None-Match"] = config.lastEtag;
  if (config.lastModified) headers["If-Modified-Since"] = config.lastModified;
  return { ok: true, skipped: false, url, headers };
}

export function webPageMetadata(html = "", { fallbackTitle = "Untitled web page" } = {}) {
  const title = stripWebHtml(
    extractWebMeta(html, "og:title") ||
    extractWebMeta(html, "twitter:title") ||
    String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    fallbackTitle
  );
  const description = stripWebHtml(extractWebMeta(html, "og:description") || extractWebMeta(html, "description") || "");
  const publishedAt = extractWebMeta(html, "article:published_time") || extractWebMeta(html, "datePublished") || extractWebMeta(html, "publishdate") || extractWebMeta(html, "pubdate") || "";
  return { title, description, publishedAt };
}

export function webNormalizedItem({ source = {}, url = "", metadata = {}, publishedToday = () => false, scoreText = () => 0 } = {}) {
  const publishedAt = metadata.publishedAt && publishedToday(metadata.publishedAt) ? new Date(metadata.publishedAt).toISOString() : null;
  return {
    source,
    stableId: `${url}:${metadata.title || source.name || "Untitled web page"}`,
    canonicalUrl: url,
    title: metadata.title || source.name || "Untitled web page",
    body: metadata.description || "",
    publishedAt,
    relevanceScore: scoreText(`${metadata.title || ""} ${metadata.description || ""}`, source.config?.keywords),
    risingScore: 0.05,
  };
}

function headerValue(headers = {}, name = "") {
  return typeof headers.get === "function"
    ? headers.get(name)
    : headers[name] || headers[name.toLowerCase()] || "";
}

export function webNextConfig({ config = {}, inserted = 0, fetchedAt = "", responseHeaders = {} } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchedCount: 1,
    lastInsertedCount: inserted,
    lastFetchCacheStatus: inserted ? "new-item" : "deduped",
    lastFetchError: "",
    lastEtag: headerValue(responseHeaders, "etag") || config.lastEtag || "",
    lastModified: headerValue(responseHeaders, "last-modified") || config.lastModified || "",
  };
}

export function webCacheHitConfig({ config = {}, fetchedAt = "" } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchCacheStatus: "not-modified",
    lastInsertedCount: 0,
    lastFetchError: "",
  };
}

export function webErrorConfig({ config = {}, fetchedAt = "", error = "" } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchCacheStatus: "error",
    lastInsertedCount: 0,
    lastFetchError: String(error || "Web fetch failed"),
  };
}
