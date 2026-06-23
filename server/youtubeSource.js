import { parseGenericFeed, stripFeedHtml } from "./rssSource.js";

const YOUTUBE_FEED_BASE = "https://www.youtube.com/feeds/videos.xml";

function cleanYouTubeText(value = "") {
  return stripFeedHtml(String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

export function youtubeFeedUrlForChannel(channelId = "") {
  const cleanId = String(channelId || "").trim();
  return cleanId ? `${YOUTUBE_FEED_BASE}?channel_id=${encodeURIComponent(cleanId)}` : "";
}

export function youtubeFeedUrlForPlaylist(playlistId = "") {
  const cleanId = String(playlistId || "").trim();
  return cleanId ? `${YOUTUBE_FEED_BASE}?playlist_id=${encodeURIComponent(cleanId)}` : "";
}

export function youtubeChannelPageUrl(channel = "") {
  const cleanChannel = String(channel || "").trim();
  if (!cleanChannel) return "";
  if (/^https?:\/\//i.test(cleanChannel)) return cleanChannel;
  if (cleanChannel.startsWith("@")) return `https://www.youtube.com/@${encodeURIComponent(cleanChannel.slice(1))}`;
  if (/^UC[A-Za-z0-9_-]{20,}$/i.test(cleanChannel)) return `https://www.youtube.com/channel/${encodeURIComponent(cleanChannel)}`;
  return `https://www.youtube.com/@${encodeURIComponent(cleanChannel.replace(/^@/, ""))}`;
}

export function youtubeChannelIdFromPage(html = "") {
  const text = String(html || "");
  const patterns = [
    /"channelId"\s*:\s*"([^"]+)"/i,
    /"externalId"\s*:\s*"([^"]+)"/i,
    /<meta\s+itemprop=["']channelId["']\s+content=["']([^"']+)["']/i,
    /\/channel\/(UC[A-Za-z0-9_-]{20,})/i,
  ];
  return patterns.map((pattern) => text.match(pattern)?.[1]).find(Boolean) || "";
}

export function youtubeRequestPlan(source = {}) {
  const config = source.config || {};
  const mode = config.mode || "channel";
  const feedUrl = config.feedUrl || (
    mode === "playlist"
      ? youtubeFeedUrlForPlaylist(config.playlistId || source.locator)
      : youtubeFeedUrlForChannel(config.channelId || (/^UC[A-Za-z0-9_-]{20,}$/i.test(String(config.channel || source.locator || "").trim()) ? config.channel || source.locator : ""))
  );
  if (feedUrl) {
    return {
      ok: true,
      skipped: false,
      feedUrl,
      resolveUrl: "",
      headers: { "User-Agent": "PillarTime/0.1" },
    };
  }
  if (mode === "channel") {
    const resolveUrl = youtubeChannelPageUrl(config.channel || source.locator);
    if (resolveUrl) {
      return {
        ok: true,
        skipped: false,
        feedUrl: "",
        resolveUrl,
        headers: { "User-Agent": "PillarTime/0.1" },
      };
    }
  }
  return {
    ok: false,
    skipped: true,
    reason: mode === "search" ? "YouTube keyword search needs a Data API connector." : "No YouTube channel or playlist configured",
    feedUrl: "",
    resolveUrl: "",
    headers: {},
  };
}

export function parseYouTubeFeed(xml = "") {
  const entries = [...String(xml || "").matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  return parseGenericFeed(xml).map((item, index) => {
    const videoId = String(item.stableId || "").match(/yt:video:([^/]+)/i)?.[1] || "";
    const mediaDescription = entries[index]?.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i)?.[1] || "";
    return {
      ...item,
      body: item.body || cleanYouTubeText(mediaDescription),
      stableId: videoId || item.stableId,
      url: item.url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""),
    };
  });
}

export function youtubeItemsForToday(xml = "", { maxItems = 5, publishedToday = () => false } = {}) {
  const parsedItems = parseYouTubeFeed(xml).slice(0, Number(maxItems || 5));
  const items = parsedItems.filter((item) => publishedToday(item.publishedAt));
  return { parsedItems, items };
}

export function youtubeNextConfig({ config = {}, channelId = "", feedUrl = "", parsedItems = [], items = [], inserted = 0, fetchedAt = "" } = {}) {
  return {
    ...config,
    ...(channelId ? { channelId } : {}),
    ...(feedUrl ? { feedUrl } : {}),
    lastFetchedAt: fetchedAt,
    lastFetchedCount: parsedItems.length,
    lastFetchedTodayCount: items.length,
    lastInsertedCount: inserted,
    lastFetchCacheStatus: inserted ? "new-items" : "deduped",
  };
}
