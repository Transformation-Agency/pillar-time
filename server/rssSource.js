function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function tagValue(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function attrValue(xml, attr) {
  const match = String(xml || "").match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

export function stripFeedHtml(value = "") {
  return decodeXml(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

export function parseGenericFeed(xml = "") {
  const rssItems = [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    return {
      title: tagValue(item, "title") || "Untitled item",
      url: tagValue(item, "link") || tagValue(item, "guid"),
      body: stripFeedHtml(tagValue(item, "description") || tagValue(item, "content:encoded")),
      publishedAt: tagValue(item, "pubDate") || tagValue(item, "dc:date"),
      stableId: tagValue(item, "guid") || tagValue(item, "link") || tagValue(item, "title"),
    };
  });
  const atomItems = [...String(xml).matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => {
    const item = match[0];
    const link = item.match(/<link\b[^>]*>/i)?.[0] || "";
    return {
      title: tagValue(item, "title") || "Untitled item",
      url: attrValue(link, "href") || tagValue(item, "id"),
      body: stripFeedHtml(tagValue(item, "summary") || tagValue(item, "content")),
      publishedAt: tagValue(item, "published") || tagValue(item, "updated"),
      stableId: tagValue(item, "id") || attrValue(link, "href") || tagValue(item, "title"),
    };
  });
  return [...rssItems, ...atomItems].filter((item) => item.title || item.url);
}

export function rssRequestPlan(source = {}) {
  const config = source.config || {};
  const feedUrl = config.feedUrl || source.locator;
  if (!feedUrl) {
    return { ok: false, skipped: true, reason: "No RSS feed URL configured", feedUrl: "", headers: {} };
  }
  const headers = { "User-Agent": "PillarTime/0.1" };
  if (config.lastEtag) headers["If-None-Match"] = config.lastEtag;
  if (config.lastModified) headers["If-Modified-Since"] = config.lastModified;
  return { ok: true, skipped: false, feedUrl, headers };
}

export function rssItemsForToday(xml = "", { maxItems = 8, publishedToday = () => false } = {}) {
  const parsedItems = parseGenericFeed(xml).slice(0, Number(maxItems || 8));
  const items = parsedItems.filter((item) => publishedToday(item.publishedAt));
  return { parsedItems, items };
}

export function rssNextConfig({ config = {}, parsedItems = [], items = [], inserted = 0, fetchedAt = "", responseHeaders = {} } = {}) {
  const getHeader = (name) => typeof responseHeaders.get === "function"
    ? responseHeaders.get(name)
    : responseHeaders[name] || responseHeaders[name.toLowerCase()] || "";
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchedCount: parsedItems.length,
    lastFetchedTodayCount: items.length,
    lastInsertedCount: inserted,
    lastFetchCacheStatus: inserted ? "new-items" : "deduped",
    lastEtag: getHeader("etag") || config.lastEtag || "",
    lastModified: getHeader("last-modified") || config.lastModified || "",
  };
}

export function rssCacheHitConfig({ config = {}, fetchedAt = "" } = {}) {
  return {
    ...config,
    lastFetchedAt: fetchedAt,
    lastFetchCacheStatus: "not-modified",
    lastInsertedCount: 0,
  };
}
