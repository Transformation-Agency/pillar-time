import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultConfig,
  sourceDefinitions,
  sourceSubmitRequest,
} from "../src/sourceForm.js";
import {
  parseGenericFeed,
  rssCacheHitConfig,
  rssItemsForToday,
  rssNextConfig,
  rssRequestPlan,
} from "../server/rssSource.js";

const sampleFeed = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title>AI policy memo</title>
    <link>https://example.com/ai-policy</link>
    <guid>memo-1</guid>
    <pubDate>Mon, 22 Jun 2026 15:00:00 GMT</pubDate>
    <description><![CDATA[<p>Compute and policy details.</p>]]></description>
  </item>
  <item>
    <title>Older market note</title>
    <link>https://example.com/old</link>
    <pubDate>Sun, 21 Jun 2026 15:00:00 GMT</pubDate>
    <description>Old news</description>
  </item>
</channel></rss>
<feed>
  <entry>
    <title>Atom science note</title>
    <id>atom-1</id>
    <link href="https://example.com/science" />
    <updated>2026-06-22T18:00:00Z</updated>
    <summary><![CDATA[<b>Science</b> update]]></summary>
  </entry>
</feed>`;

test("RSS source form requires feed URL and optional keywords", () => {
  assert.deepEqual(defaultConfig("RSS"), { mode: "feed" });
  assert.deepEqual(sourceDefinitions.RSS.modes.feed.fields, [
    ["feedUrl", "Feed URL", "https://site.com/feed.xml"],
    ["keywords", "Optional keywords", "compute, policy, AI"],
  ]);
});

test("RSS add source request saves locator and config payload", () => {
  const request = sourceSubmitRequest({
    form: {
      name: "Example RSS",
      type: "RSS",
      config: {
        mode: "feed",
        feedUrl: "https://example.com/feed.xml",
        keywords: "AI, policy",
      },
    },
    mode: "feed",
  });

  assert.deepEqual(request, {
    endpoint: "/api/sources",
    method: "POST",
    payload: {
      name: "Example RSS",
      type: "RSS",
      locator: "https://example.com/feed.xml",
      config: {
        mode: "feed",
        feedUrl: "https://example.com/feed.xml",
        keywords: "AI, policy",
      },
    },
  });
});

test("RSS edit source request patches the existing source", () => {
  const request = sourceSubmitRequest({
    form: {
      id: "src-1",
      name: "Edited RSS",
      type: "RSS",
      config: { feedUrl: "https://example.com/edited.xml", keywords: "markets" },
    },
    editingSource: { id: "src-1" },
    mode: "feed",
  });

  assert.equal(request.endpoint, "/api/sources/src-1");
  assert.equal(request.method, "PATCH");
  assert.equal(request.payload.locator, "https://example.com/edited.xml");
  assert.equal(request.payload.config.mode, "feed");
});

test("RSS request plan builds conditional feed headers and skips missing URL", () => {
  assert.deepEqual(rssRequestPlan({ config: {} }), {
    ok: false,
    skipped: true,
    reason: "No RSS feed URL configured",
    feedUrl: "",
    headers: {},
  });
  assert.deepEqual(rssRequestPlan({
    locator: "https://example.com/fallback.xml",
    config: {
      lastEtag: "\"abc\"",
      lastModified: "Mon, 22 Jun 2026 10:00:00 GMT",
    },
  }), {
    ok: true,
    skipped: false,
    feedUrl: "https://example.com/fallback.xml",
    headers: {
      "User-Agent": "PillarTime/0.1",
      "If-None-Match": "\"abc\"",
      "If-Modified-Since": "Mon, 22 Jun 2026 10:00:00 GMT",
    },
  });
});

test("RSS parser reads RSS and Atom items with stripped summaries", () => {
  assert.deepEqual(parseGenericFeed(sampleFeed), [
    {
      title: "AI policy memo",
      url: "https://example.com/ai-policy",
      body: "Compute and policy details.",
      publishedAt: "Mon, 22 Jun 2026 15:00:00 GMT",
      stableId: "memo-1",
    },
    {
      title: "Older market note",
      url: "https://example.com/old",
      body: "Old news",
      publishedAt: "Sun, 21 Jun 2026 15:00:00 GMT",
      stableId: "https://example.com/old",
    },
    {
      title: "Atom science note",
      url: "https://example.com/science",
      body: "Science update",
      publishedAt: "2026-06-22T18:00:00Z",
      stableId: "atom-1",
    },
  ]);
});

test("RSS today planning caps fetched items before today filtering", () => {
  const result = rssItemsForToday(sampleFeed, {
    maxItems: 2,
    publishedToday: (value) => String(value).includes("22 Jun 2026"),
  });

  assert.equal(result.parsedItems.length, 2);
  assert.deepEqual(result.items.map((item) => item.title), ["AI policy memo"]);
});

test("RSS next config records fetched counts, inserted counts, and cache validators", () => {
  const next = rssNextConfig({
    config: { keywords: "AI", lastEtag: "old" },
    parsedItems: [{}, {}, {}],
    items: [{}, {}],
    inserted: 2,
    fetchedAt: "2026-06-22T12:00:00.000Z",
    responseHeaders: {
      get(name) {
        if (name === "etag") return "new-etag";
        if (name === "last-modified") return "Mon, 22 Jun 2026 10:00:00 GMT";
        return "";
      },
    },
  });

  assert.deepEqual(next, {
    keywords: "AI",
    lastEtag: "new-etag",
    lastFetchedAt: "2026-06-22T12:00:00.000Z",
    lastFetchedCount: 3,
    lastFetchedTodayCount: 2,
    lastInsertedCount: 2,
    lastFetchCacheStatus: "new-items",
    lastModified: "Mon, 22 Jun 2026 10:00:00 GMT",
  });
  assert.deepEqual(rssCacheHitConfig({ config: { keywords: "AI" }, fetchedAt: "now" }), {
    keywords: "AI",
    lastFetchedAt: "now",
    lastFetchCacheStatus: "not-modified",
    lastInsertedCount: 0,
  });
});
