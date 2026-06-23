export const X_QUICK_MAX_RESULTS = 10;
export const X_ESTIMATED_POST_READ_COST_USD = 0.005;

export function xQuickQuery(rawQuery = "") {
  let query = String(rawQuery || "").trim();
  if (!query) return "";
  if (!/\bis:retweet\b/i.test(query) && !/\b-is:retweet\b/i.test(query)) query += " -is:retweet";
  if (!/\bis:reply\b/i.test(query) && !/\b-is:reply\b/i.test(query)) query += " -is:reply";
  return query;
}

export function xFetchReadiness({ config = {}, token = "" } = {}) {
  if (!config.query) return { ok: true, skipped: true, reason: "No X query configured", inserted: 0, seen: 0 };
  if (!token) return { ok: true, skipped: true, reason: "X connector is missing or disabled", inserted: 0, seen: 0 };
  return { ok: true, skipped: false };
}

export function xQueryParams(config = {}, { startTime = new Date(), maxResults = X_QUICK_MAX_RESULTS } = {}) {
  return new URLSearchParams({
    query: xQuickQuery(config.query || ""),
    max_results: String(Math.min(X_QUICK_MAX_RESULTS, Math.max(10, Number(maxResults || X_QUICK_MAX_RESULTS)))),
    "tweet.fields": "created_at,public_metrics,author_id,lang",
    start_time: startTime instanceof Date ? startTime.toISOString() : String(startTime),
  });
}

export function xPostsForToday(payload = {}, { publishedToday = () => false } = {}) {
  const parsedPosts = Array.isArray(payload.data) ? payload.data.slice(0, X_QUICK_MAX_RESULTS) : [];
  const posts = parsedPosts.filter((post) => publishedToday(post.created_at));
  return { parsedPosts, posts };
}

export function xEstimatedCost(parsedPosts = []) {
  return Number((parsedPosts.length * X_ESTIMATED_POST_READ_COST_USD).toFixed(3));
}

export function xPostEngagement(post = {}) {
  const metrics = post.public_metrics || {};
  return Number(metrics.like_count || 0)
    + Number(metrics.retweet_count || 0) * 2
    + Number(metrics.reply_count || 0)
    + Number(metrics.quote_count || 0) * 2;
}

export function xPostToNormalizedItem({ source = {}, post = {}, scoreText = () => 0 } = {}) {
  const engagement = xPostEngagement(post);
  return {
    source,
    stableId: post.id,
    canonicalUrl: `https://x.com/i/web/status/${post.id}`,
    title: String(post.text || "").split(/\s+/).slice(0, 16).join(" "),
    body: post.text || "",
    publishedAt: post.created_at || null,
    relevanceScore: scoreText(post.text || "", source.config?.keywords),
    risingScore: Math.min(1, Math.log10(engagement + 1) / 4),
  };
}

export function xNextConfig({ config = {}, parsedPosts = [], posts = [], inserted = 0, fetchedAt = "" } = {}) {
  return {
    ...config,
    query: config.query,
    quickMode: true,
    quickModeLocked: true,
    lastFetchedAt: fetchedAt,
    lastFetchedCount: parsedPosts.length,
    lastFetchedTodayCount: posts.length,
    lastInsertedCount: inserted,
    lastEstimatedCostUsd: xEstimatedCost(parsedPosts),
  };
}
