import test from "node:test";
import assert from "node:assert/strict";

import {
  redditCredentialData,
  redditJsonUrlForSource,
  redditNextConfig,
  redditOAuthPathForSource,
  redditPostBody,
  redditPostPublishedAt,
  redditPostsFromListing,
  redditPostToNormalizedItem,
  redditRssUrlForSource,
  redditShouldUseRssFallback,
  redditTokenRequestPlan,
} from "../server/redditSource.js";

test("Reddit credential data merges stored values with environment fallback", () => {
  assert.deepEqual(redditCredentialData({
    storedData: { grantType: "installed_client" },
    rowEnabled: false,
    envClientId: "env-client",
    envClientSecret: "",
  }), {
    enabled: true,
    data: {
      grantType: "installed_client",
      clientId: "env-client",
      clientSecret: "",
      deviceId: "DO_NOT_TRACK_THIS_DEVICE",
    },
  });

  assert.deepEqual(redditCredentialData({
    storedData: { clientId: "saved-client", clientSecret: "saved-secret" },
    rowEnabled: true,
  }).data.grantType, "client_credentials");
});

test("Reddit token request plan supports installed and client credential grants", () => {
  const installed = redditTokenRequestPlan({
    clientId: "cid",
    grantType: "installed_client",
    deviceId: "device-1",
  });
  assert.equal(installed.grantType, "installed_client");
  assert.equal(installed.url, "https://www.reddit.com/api/v1/access_token");
  assert.equal(installed.body.get("grant_type"), "https://oauth.reddit.com/grants/installed_client");
  assert.equal(installed.body.get("device_id"), "device-1");
  assert.equal(installed.headers.Authorization, "Basic Y2lkOg==");

  const client = redditTokenRequestPlan({
    clientId: "cid",
    clientSecret: "secret",
    grantType: "client_credentials",
  });
  assert.equal(client.grantType, "client_credentials");
  assert.equal(client.body.get("grant_type"), "client_credentials");
  assert.equal(client.headers.Authorization, "Basic Y2lkOnNlY3JldA==");
});

test("Reddit source URLs normalize subreddit, user, and search modes", () => {
  const subreddit = { locator: "subreddits:worldnews,news", config: { mode: "subreddit", sort: "hot", maxItems: 99 } };
  assert.equal(redditOAuthPathForSource(subreddit), "/r/worldnews/hot.json?limit=25&raw_json=1");
  assert.equal(redditJsonUrlForSource(subreddit), "https://www.reddit.com/r/worldnews/hot.json?limit=25&raw_json=1");
  assert.equal(redditRssUrlForSource(subreddit), "https://www.reddit.com/r/worldnews/hot.rss");

  const user = { config: { mode: "user", username: "u/test-user", maxItems: 1 } };
  assert.equal(redditOAuthPathForSource(user), "/user/test-user/submitted.json?limit=5&raw_json=1");
  assert.equal(redditJsonUrlForSource(user), "https://www.reddit.com/user/test-user/submitted.json?limit=5&raw_json=1");
  assert.equal(redditRssUrlForSource(user), "https://www.reddit.com/user/test-user/submitted.rss");

  const search = { locator: "AI policy", config: { mode: "search", sort: "top" } };
  assert.equal(redditOAuthPathForSource(search), "/search.json?q=AI+policy&sort=top&t=day&limit=10&raw_json=1");
  assert.equal(redditJsonUrlForSource(search), "https://www.reddit.com/search.json?q=AI+policy&sort=top&t=day&limit=10&raw_json=1");
  assert.equal(redditRssUrlForSource(search), "https://www.reddit.com/search.rss?q=AI+policy&sort=top&t=day");
});

test("Reddit listing posts normalize to saved source items", () => {
  const payload = {
    data: {
      children: [{
        data: {
          id: "abc",
          name: "t3_abc",
          title: "AI policy discussion",
          selftext: "Long comment thread",
          url: "https://example.com/report",
          permalink: "/r/news/comments/abc/post/",
          created_utc: 1782144000,
          score: 90,
          num_comments: 30,
        },
      }],
    },
  };
  const [post] = redditPostsFromListing(payload);
  const source = { id: "src-reddit", config: { keywords: "AI, policy" } };

  assert.equal(redditPostPublishedAt(post), "2026-06-22T16:00:00.000Z");
  assert.equal(redditPostBody(post), "Long comment thread\nLink: https://example.com/report");
  assert.deepEqual(redditPostToNormalizedItem({
    source,
    post,
    scoreText: () => 0.5,
  }), {
    source,
    stableId: "t3_abc",
    canonicalUrl: "https://www.reddit.com/r/news/comments/abc/post/",
    title: "AI policy discussion",
    body: "Long comment thread\nLink: https://example.com/report",
    publishedAt: "2026-06-22T16:00:00.000Z",
    relevanceScore: 0.5,
    risingScore: Math.min(1, Math.log10(121) / 4),
  });
});

test("Reddit fallback and next config record degraded and successful fetch modes", () => {
  assert.equal(redditShouldUseRssFallback(403), true);
  assert.equal(redditShouldUseRssFallback(429), true);
  assert.equal(redditShouldUseRssFallback(500), false);

  assert.deepEqual(redditNextConfig({
    config: { mode: "subreddit", subreddits: "news" },
    parsedCount: 12,
    todayCount: 4,
    inserted: 3,
    fetchedAt: "2026-06-22T12:00:00.000Z",
    mode: "rss-fallback",
  }), {
    mode: "subreddit",
    subreddits: "news",
    lastFetchedAt: "2026-06-22T12:00:00.000Z",
    lastFetchedCount: 12,
    lastFetchedTodayCount: 4,
    lastInsertedCount: 3,
    lastFetchMode: "rss-fallback",
  });
});
