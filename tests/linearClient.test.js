import test from "node:test";
import assert from "node:assert/strict";

import { groupIssuesByProject, LinearClient, LinearClientError } from "../server/linearClient.js";

function jsonResponse(payload, { status = 200, statusText = "OK", headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: { get: (name) => headers[name.toLowerCase()] },
    json: async () => payload,
  };
}

function issue(overrides = {}) {
  return {
    id: overrides.id || "issue-1",
    identifier: overrides.identifier || "TRA-1",
    title: overrides.title || "Wire Linear connector",
    description: overrides.description || "",
    url: overrides.url || "https://linear.app/transformation-agency/issue/TRA-1/wire-linear-connector",
    priority: overrides.priority ?? 2,
    priorityLabel: overrides.priorityLabel || "High",
    dueDate: overrides.dueDate || null,
    createdAt: "2026-06-18T10:00:00.000Z",
    updatedAt: "2026-06-18T12:00:00.000Z",
    team: { id: "team-tra", key: "TRA", name: "Transformation Agency" },
    state: { id: "state-started", name: "In Progress", type: "started", position: 10, team: { id: "team-tra", key: "TRA", name: "Transformation Agency" } },
    assignee: { id: "user-1", name: "Paul", displayName: "Paul", email: "paul@example.com", url: "" },
    project: overrides.project === undefined ? { id: "project-foundation", name: "Foundation / Cross-Cutting", state: "started", url: "", teams: { nodes: [{ id: "team-tra", key: "TRA", name: "Transformation Agency" }] } } : overrides.project,
    labels: { nodes: [{ id: "label-owner", name: "Owner: Paul", color: "#111111" }] },
    blockedBy: { nodes: [] },
    comments: { nodes: [] },
    ...overrides,
  };
}

test("LinearClient sends personal API key directly without Bearer", async () => {
  let request;
  const client = new LinearClient({
    apiKey: "lin_api_test",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return jsonResponse({ data: { viewer: { id: "user-1", name: "Paul", displayName: "Paul", email: "paul@example.com", url: "" } } });
    },
  });

  const viewer = await client.viewer();

  assert.equal(request.url, "https://api.linear.app/graphql");
  assert.equal(request.init.headers.authorization, "lin_api_test");
  assert.doesNotMatch(request.init.headers.authorization, /^Bearer\s+/);
  assert.equal(viewer.displayName, "Paul");
});

test("LinearClient requires LINEAR_API_KEY", async () => {
  const client = new LinearClient({ apiKey: "", fetchImpl: async () => jsonResponse({ data: {} }) });
  await assert.rejects(() => client.viewer(), LinearClientError);
});

test("LinearClient paginates issues and groups them by project", async () => {
  const calls = [];
  const client = new LinearClient({
    apiKey: "lin_api_test",
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.query.includes("Viewer")) return jsonResponse({ data: { viewer: { id: "user-1", name: "Paul", displayName: "Paul", email: "", url: "" } } });
      if (!body.variables.after) return jsonResponse({ data: { issues: { nodes: [issue({ id: "issue-1", identifier: "TRA-1" })], pageInfo: { hasNextPage: true, endCursor: "cursor-1" } } } });
      return jsonResponse({ data: { issues: { nodes: [issue({ id: "issue-2", identifier: "TRA-2", project: null })], pageInfo: { hasNextPage: false, endCursor: null } } } });
    },
  });

  const result = await client.issues({ teamKey: "TRA", assignee: "me", first: 1, pages: 2 });
  const groups = groupIssuesByProject(result.issues);

  assert.equal(result.issues.length, 2);
  assert.equal(calls[1].variables.filter.assignee.id.eq, "user-1");
  assert.equal(calls[1].variables.filter.team.key.eq, "TRA");
  assert.equal(calls[2].variables.after, "cursor-1");
  assert.deepEqual(groups.map((group) => group.name), ["Foundation / Cross-Cutting", "No project"]);
});

test("LinearClient create, update, and comment mutations send expected variables", async () => {
  const calls = [];
  const client = new LinearClient({
    apiKey: "lin_api_test",
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.query.includes("CreateIssue")) return jsonResponse({ data: { issueCreate: { success: true, issue: issue({ id: "issue-created", identifier: "TRA-10", title: body.variables.input.title }) } } });
      if (body.query.includes("UpdateIssue")) return jsonResponse({ data: { issueUpdate: { success: true, issue: issue({ id: body.variables.id, identifier: "TRA-10", title: "Updated title" }) } } });
      if (body.query.includes("AddComment")) return jsonResponse({ data: { commentCreate: { success: true, comment: { id: "comment-1", body: body.variables.input.body, createdAt: "2026-06-18T12:30:00.000Z", user: { id: "user-1", name: "Paul", displayName: "Paul", email: "", url: "" } } } } });
      return jsonResponse({ data: {} });
    },
  });

  const created = await client.createIssue({ teamId: "team-tra", title: "New work", description: "", projectId: "" });
  const updated = await client.updateIssue(created.id, { stateId: "state-done", assigneeId: "" });
  const comment = await client.addComment(created.id, "Looks good.");

  assert.equal(created.identifier, "TRA-10");
  assert.equal(updated.title, "Updated title");
  assert.equal(comment.body, "Looks good.");
  assert.deepEqual(calls[0].variables.input, { teamId: "team-tra", title: "New work" });
  assert.deepEqual(calls[1].variables, { id: "issue-created", input: { stateId: "state-done" } });
  assert.deepEqual(calls[2].variables.input, { issueId: "issue-created", body: "Looks good." });
});

test("LinearClient retries one rate-limited request", async () => {
  let attempts = 0;
  const client = new LinearClient({
    apiKey: "lin_api_test",
    retryDelayMs: 1,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return jsonResponse({ errors: [{ message: "rate limited" }] }, { status: 429, statusText: "Too Many Requests" });
      return jsonResponse({ data: { viewer: { id: "user-1", name: "Paul", displayName: "Paul", email: "", url: "" } } });
    },
  });

  const viewer = await client.viewer();

  assert.equal(viewer.id, "user-1");
  assert.equal(attempts, 2);
});

test("Linear live smoke is opt-in", async (t) => {
  if (process.env.RUN_LINEAR_SMOKE !== "1") {
    t.skip("Set RUN_LINEAR_SMOKE=1 and LINEAR_API_KEY to run the live Linear smoke test.");
    return;
  }
  const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
  const viewer = await client.viewer();
  assert.ok(viewer?.id);
});
