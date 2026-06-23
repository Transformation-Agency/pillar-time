import test from "node:test";
import assert from "node:assert/strict";

import {
  X_QUICK_MAX_RESULTS,
  xEstimatedCost,
  xFetchReadiness,
  xNextConfig,
  xPostEngagement,
  xPostToNormalizedItem,
  xPostsForToday,
  xQueryParams,
  xQuickQuery,
} from "../server/xSource.js";

test("X quick query excludes retweets and replies without duplicating operators", () => {
  assert.equal(xQuickQuery("AI min_faves:500"), "AI min_faves:500 -is:retweet -is:reply");
  assert.equal(xQuickQuery("AI -is:retweet -is:reply"), "AI -is:retweet -is:reply");
  assert.equal(xQuickQuery("  "), "");
});

test("X fetch readiness requires query and bearer token", () => {
  assert.deepEqual(xFetchReadiness({ config: {}, token: "token" }), {
    ok: true,
    skipped: true,
    reason: "No X query configured",
    inserted: 0,
    seen: 0,
  });
  assert.deepEqual(xFetchReadiness({ config: { query: "AI" }, token: "" }), {
    ok: true,
    skipped: true,
    reason: "X connector is missing or disabled",
    inserted: 0,
    seen: 0,
  });
  assert.deepEqual(xFetchReadiness({ config: { query: "AI" }, token: "token" }), {
    ok: true,
    skipped: false,
  });
});

test("X query params are locked to quick mode fields and max result cap", () => {
  const params = xQueryParams({ query: "AI" }, {
    startTime: new Date("2026-06-22T06:00:00.000Z"),
    maxResults: 99,
  });

  assert.equal(params.get("query"), "AI -is:retweet -is:reply");
  assert.equal(params.get("max_results"), String(X_QUICK_MAX_RESULTS));
  assert.equal(params.get("tweet.fields"), "created_at,public_metrics,author_id,lang");
  assert.equal(params.get("start_time"), "2026-06-22T06:00:00.000Z");
});

test("X posts are capped before today filtering", () => {
  const payload = {
    data: Array.from({ length: 12 }, (_, index) => ({
      id: String(index + 1),
      text: `post ${index + 1}`,
      created_at: index === 10 ? "2026-06-21T12:00:00Z" : "2026-06-22T12:00:00Z",
    })),
  };

  const result = xPostsForToday(payload, {
    publishedToday: (value) => value.startsWith("2026-06-22"),
  });

  assert.equal(result.parsedPosts.length, 10);
  assert.equal(result.posts.length, 10);
  assert.equal(result.parsedPosts.at(-1).id, "10");
});

test("X post normalization calculates engagement, rising score, and canonical URL", () => {
  const post = {
    id: "123",
    text: "AI infrastructure markets and policy move faster than teams can absorb today",
    created_at: "2026-06-22T12:00:00Z",
    public_metrics: {
      like_count: 90,
      retweet_count: 5,
      reply_count: 10,
      quote_count: 5,
    },
  };
  const source = { id: "src-x", config: { keywords: "AI, policy" } };

  assert.equal(xPostEngagement(post), 120);
  assert.deepEqual(xPostToNormalizedItem({
    source,
    post,
    scoreText: () => 0.66,
  }), {
    source,
    stableId: "123",
    canonicalUrl: "https://x.com/i/web/status/123",
    title: "AI infrastructure markets and policy move faster than teams can absorb today",
    body: "AI infrastructure markets and policy move faster than teams can absorb today",
    publishedAt: "2026-06-22T12:00:00Z",
    relevanceScore: 0.66,
    risingScore: Math.min(1, Math.log10(121) / 4),
  });
});

test("X cost and next config report quick-mode diagnostics", () => {
  const parsedPosts = Array.from({ length: 10 }, (_, index) => ({ id: String(index) }));
  const posts = parsedPosts.slice(0, 4);

  assert.equal(xEstimatedCost(parsedPosts), 0.05);
  assert.deepEqual(xNextConfig({
    config: { query: "AI", keywords: "policy" },
    parsedPosts,
    posts,
    inserted: 3,
    fetchedAt: "2026-06-22T12:00:00.000Z",
  }), {
    query: "AI",
    keywords: "policy",
    quickMode: true,
    quickModeLocked: true,
    lastFetchedAt: "2026-06-22T12:00:00.000Z",
    lastFetchedCount: 10,
    lastFetchedTodayCount: 4,
    lastInsertedCount: 3,
    lastEstimatedCostUsd: 0.05,
  });
});
