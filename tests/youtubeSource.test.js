import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultConfig,
  sourceDefinitions,
  sourceSubmitRequest,
} from "../src/sourceForm.js";
import {
  parseYouTubeFeed,
  youtubeChannelIdFromPage,
  youtubeChannelPageUrl,
  youtubeFeedUrlForChannel,
  youtubeFeedUrlForPlaylist,
  youtubeItemsForToday,
  youtubeNextConfig,
  youtubeRequestPlan,
} from "../server/youtubeSource.js";

const sampleYouTubeFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <id>yt:video:abc123</id>
    <yt:videoId>abc123</yt:videoId>
    <yt:channelId>UCSHZKyawb77ixDdsGog4iWA</yt:channelId>
    <title><![CDATA[AI policy interview]]></title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/>
    <published>2026-06-22T12:00:00+00:00</published>
    <updated>2026-06-22T13:00:00+00:00</updated>
    <media:group>
      <media:description><![CDATA[Frontier compute &amp; policy.]]></media:description>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:old456</id>
    <title>Older video</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=old456"/>
    <published>2026-06-21T12:00:00+00:00</published>
  </entry>
</feed>`;

test("YouTube source form exposes channel, playlist, and search modes", () => {
  assert.deepEqual(defaultConfig("YouTube"), { mode: "channel" });
  assert.deepEqual(Object.keys(sourceDefinitions.YouTube.modes), ["channel", "playlist", "search"]);
  assert.deepEqual(sourceDefinitions.YouTube.modes.channel.fields, [
    ["channel", "Channel ID or handle", "@lexfridman"],
    ["keywords", "Optional keywords", "AI, geopolitics"],
  ]);
});

test("YouTube add source requests preserve mode config and locator", () => {
  assert.deepEqual(sourceSubmitRequest({
    form: {
      name: "Lex",
      type: "YouTube",
      config: { mode: "channel", channel: "@lexfridman", keywords: "AI" },
    },
    mode: "channel",
  }), {
    endpoint: "/api/sources",
    method: "POST",
    payload: {
      name: "Lex",
      type: "YouTube",
      locator: "@lexfridman",
      config: { mode: "channel", channel: "@lexfridman", keywords: "AI" },
    },
  });

  assert.equal(sourceSubmitRequest({
    form: { name: "Playlist", type: "YouTube", config: { playlistId: "PL123" } },
    mode: "playlist",
  }).payload.locator, "PL123");

  assert.equal(sourceSubmitRequest({
    form: { name: "Search", type: "YouTube", config: { query: "AI infrastructure" } },
    mode: "search",
  }).payload.locator, "search:AI infrastructure");
});

test("YouTube feed URL helpers build channel, playlist, and handle resolve plans", () => {
  assert.equal(youtubeFeedUrlForChannel("UCSHZKyawb77ixDdsGog4iWA"), "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA");
  assert.equal(youtubeFeedUrlForPlaylist("PL 123"), "https://www.youtube.com/feeds/videos.xml?playlist_id=PL%20123");
  assert.equal(youtubeChannelPageUrl("@lexfridman"), "https://www.youtube.com/@lexfridman");

  assert.deepEqual(youtubeRequestPlan({ config: { mode: "channel", channelId: "UCSHZKyawb77ixDdsGog4iWA" } }), {
    ok: true,
    skipped: false,
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    resolveUrl: "",
    headers: { "User-Agent": "PillarTime/0.1" },
  });
  assert.equal(youtubeRequestPlan({ locator: "@lexfridman", config: { mode: "channel" } }).resolveUrl, "https://www.youtube.com/@lexfridman");
  assert.deepEqual(youtubeRequestPlan({ config: { mode: "search", query: "AI" } }), {
    ok: false,
    skipped: true,
    reason: "YouTube keyword search needs a Data API connector.",
    feedUrl: "",
    resolveUrl: "",
    headers: {},
  });
});

test("YouTube channel ID can be extracted from public page metadata", () => {
  assert.equal(youtubeChannelIdFromPage('<script>{"channelId":"UCSHZKyawb77ixDdsGog4iWA"}</script>'), "UCSHZKyawb77ixDdsGog4iWA");
  assert.equal(youtubeChannelIdFromPage('<meta itemprop="channelId" content="UCabc12345678901234567890">'), "UCabc12345678901234567890");
});

test("YouTube parser normalizes Atom feed entries", () => {
  assert.deepEqual(parseYouTubeFeed(sampleYouTubeFeed), [
    {
      title: "AI policy interview",
      url: "https://www.youtube.com/watch?v=abc123",
      body: "Frontier compute & policy.",
      publishedAt: "2026-06-22T12:00:00+00:00",
      stableId: "abc123",
    },
    {
      title: "Older video",
      url: "https://www.youtube.com/watch?v=old456",
      body: "",
      publishedAt: "2026-06-21T12:00:00+00:00",
      stableId: "old456",
    },
  ]);
});

test("YouTube today planning and next config record deterministic fetch state", () => {
  const result = youtubeItemsForToday(sampleYouTubeFeed, {
    maxItems: 2,
    publishedToday: (value) => String(value).startsWith("2026-06-22"),
  });
  assert.equal(result.parsedItems.length, 2);
  assert.deepEqual(result.items.map((item) => item.title), ["AI policy interview"]);

  assert.deepEqual(youtubeNextConfig({
    config: { mode: "channel", channel: "@lexfridman" },
    channelId: "UCSHZKyawb77ixDdsGog4iWA",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    parsedItems: result.parsedItems,
    items: result.items,
    inserted: 1,
    fetchedAt: "2026-06-22T12:00:00.000Z",
  }), {
    mode: "channel",
    channel: "@lexfridman",
    channelId: "UCSHZKyawb77ixDdsGog4iWA",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UCSHZKyawb77ixDdsGog4iWA",
    lastFetchedAt: "2026-06-22T12:00:00.000Z",
    lastFetchedCount: 2,
    lastFetchedTodayCount: 1,
    lastInsertedCount: 1,
    lastFetchCacheStatus: "new-items",
  });
});
