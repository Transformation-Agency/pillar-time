import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultConfig,
  sourceDefinitions,
  sourceSubmitRequest,
} from "../src/sourceForm.js";
import {
  webCacheHitConfig,
  webErrorConfig,
  webNextConfig,
  webNormalizedItem,
  webPageMetadata,
  webRequestPlan,
} from "../server/webSource.js";

const sampleHtml = `<!doctype html>
<html>
  <head>
    <meta property="og:title" content="AI policy &amp; compute report">
    <meta name="description" content="New public compute details.">
    <meta property="article:published_time" content="2026-06-22T15:00:00Z">
    <title>Fallback title</title>
  </head>
  <body><main><p>Long article body.</p></main></body>
</html>`;

test("Web source form supports page and search configs", () => {
  assert.deepEqual(defaultConfig("Web"), { mode: "page" });
  assert.deepEqual(sourceDefinitions.Web.modes.page.fields, [
    ["url", "URL", "https://example.com/report"],
  ]);
  assert.deepEqual(sourceDefinitions.Web.modes.search.fields, [
    ["url", "Site URL", "https://example.com"],
    ["query", "Search/topic terms", "AI policy OR compute"],
  ]);
});

test("Web add source request saves URL locator and query config", () => {
  const request = sourceSubmitRequest({
    form: {
      name: "Example Web",
      type: "Web",
      config: {
        mode: "search",
        url: "https://example.com",
        query: "AI policy OR compute",
      },
    },
    mode: "search",
  });

  assert.deepEqual(request, {
    endpoint: "/api/sources",
    method: "POST",
    payload: {
      name: "Example Web",
      type: "Web",
      locator: "https://example.com",
      config: {
        mode: "search",
        url: "https://example.com",
        query: "AI policy OR compute",
      },
    },
  });
});

test("Web edit source request patches the existing source", () => {
  const request = sourceSubmitRequest({
    form: {
      id: "src-1",
      name: "Edited Web",
      type: "Web",
      config: { url: "https://example.com/edited", query: "markets" },
    },
    editingSource: { id: "src-1" },
    mode: "page",
  });

  assert.equal(request.endpoint, "/api/sources/src-1");
  assert.equal(request.method, "PATCH");
  assert.equal(request.payload.locator, "https://example.com/edited");
  assert.deepEqual(request.payload.config, {
    url: "https://example.com/edited",
    query: "markets",
    mode: "page",
  });
});

test("Web request plan requires public HTTP URL and builds conditional headers", () => {
  assert.deepEqual(webRequestPlan({ locator: "not-a-url", config: {} }), {
    ok: false,
    skipped: true,
    reason: "No public web URL configured",
    url: "",
    headers: {},
  });
  assert.deepEqual(webRequestPlan({
    locator: "https://example.com/fallback",
    config: {
      lastEtag: "\"abc\"",
      lastModified: "Mon, 22 Jun 2026 10:00:00 GMT",
    },
  }), {
    ok: true,
    skipped: false,
    url: "https://example.com/fallback",
    headers: {
      "User-Agent": "PillarTime/0.1",
      "If-None-Match": "\"abc\"",
      "If-Modified-Since": "Mon, 22 Jun 2026 10:00:00 GMT",
    },
  });
});

test("Web metadata extracts title description and publish date", () => {
  assert.deepEqual(webPageMetadata(sampleHtml, { fallbackTitle: "Example" }), {
    title: "AI policy & compute report",
    description: "New public compute details.",
    publishedAt: "2026-06-22T15:00:00Z",
  });
  assert.deepEqual(webPageMetadata("<title>Plain <b>Title</b></title>", { fallbackTitle: "Example" }), {
    title: "Plain Title",
    description: "",
    publishedAt: "",
  });
});

test("Web normalized item inserts fetched text metadata and today publish date", () => {
  const source = { id: "src-web", name: "Example Web", config: { keywords: "AI, compute" } };
  const metadata = webPageMetadata(sampleHtml, { fallbackTitle: source.name });

  assert.deepEqual(webNormalizedItem({
    source,
    url: "https://example.com/report",
    metadata,
    publishedToday: (value) => value === "2026-06-22T15:00:00Z",
    scoreText: () => 0.66,
  }), {
    source,
    stableId: "https://example.com/report:AI policy & compute report",
    canonicalUrl: "https://example.com/report",
    title: "AI policy & compute report",
    body: "New public compute details.",
    publishedAt: "2026-06-22T15:00:00.000Z",
    relevanceScore: 0.66,
    risingScore: 0.05,
  });
});

test("Web config records success cache hit and fetch error metadata", () => {
  assert.deepEqual(webNextConfig({
    config: { query: "AI", lastEtag: "old" },
    inserted: 1,
    fetchedAt: "2026-06-22T12:00:00.000Z",
    responseHeaders: {
      get(name) {
        if (name === "etag") return "new-etag";
        if (name === "last-modified") return "Mon, 22 Jun 2026 10:00:00 GMT";
        return "";
      },
    },
  }), {
    query: "AI",
    lastEtag: "new-etag",
    lastFetchedAt: "2026-06-22T12:00:00.000Z",
    lastFetchedCount: 1,
    lastFetchCacheStatus: "new-item",
    lastFetchError: "",
    lastInsertedCount: 1,
    lastModified: "Mon, 22 Jun 2026 10:00:00 GMT",
  });

  assert.deepEqual(webCacheHitConfig({ config: { query: "AI" }, fetchedAt: "now" }), {
    query: "AI",
    lastFetchedAt: "now",
    lastFetchCacheStatus: "not-modified",
    lastFetchError: "",
    lastInsertedCount: 0,
  });

  assert.deepEqual(webErrorConfig({ config: { query: "AI" }, fetchedAt: "later", error: "Web fetch failed: 500 Server Error" }), {
    query: "AI",
    lastFetchedAt: "later",
    lastFetchCacheStatus: "error",
    lastFetchError: "Web fetch failed: 500 Server Error",
    lastInsertedCount: 0,
  });
});
