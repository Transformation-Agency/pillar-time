const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";
const OPEN_STATE_TYPES = ["backlog", "unstarted", "started"];

export class LinearClientError extends Error {
  constructor(message, { status = 0, details = [] } = {}) {
    super(message);
    this.name = "LinearClientError";
    this.status = status;
    this.details = details;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function compactObject(value = {}) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ""));
}

function connectionNodes(connection) {
  return Array.isArray(connection?.nodes) ? connection.nodes : [];
}

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name || user.displayName || "",
    displayName: user.displayName || user.name || "",
    email: user.email || "",
    url: user.url || "",
  };
}

function mapTeam(team) {
  if (!team) return null;
  return { id: team.id, key: team.key, name: team.name };
}

function mapProject(project) {
  if (!project) return null;
  return {
    id: project.id,
    name: project.name,
    state: project.state || "",
    url: project.url || "",
    teamKeys: connectionNodes(project.teams).map((team) => team.key).filter(Boolean),
  };
}

function mapWorkflowState(state) {
  if (!state) return null;
  return {
    id: state.id,
    name: state.name,
    type: state.type,
    position: state.position,
    team: mapTeam(state.team),
  };
}

export function mapLinearIssue(issue) {
  if (!issue) return null;
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description || "",
    url: issue.url || "",
    priority: issue.priority ?? 0,
    priorityLabel: issue.priorityLabel || "",
    dueDate: issue.dueDate || "",
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    team: mapTeam(issue.team),
    state: mapWorkflowState(issue.state),
    assignee: mapUser(issue.assignee),
    project: mapProject(issue.project),
    labels: connectionNodes(issue.labels).map((label) => ({ id: label.id, name: label.name, color: label.color || "" })),
    comments: connectionNodes(issue.comments).map((comment) => ({
      id: comment.id,
      body: comment.body || "",
      createdAt: comment.createdAt,
      user: mapUser(comment.user),
    })),
  };
}

const ISSUE_FIELDS = `
  id
  identifier
  title
  description
  url
  priority
  priorityLabel
  dueDate
  createdAt
  updatedAt
  team { id key name }
  state { id name type position team { id key name } }
  assignee { id name displayName email url }
  project { id name state url teams { nodes { id key name } } }
  labels { nodes { id name color } }
`;

export class LinearClient {
  constructor({ apiKey, fetchImpl = fetch, endpoint = LINEAR_GRAPHQL_URL, retryDelayMs = 800 } = {}) {
    this.apiKey = String(apiKey || "").trim();
    this.fetchImpl = fetchImpl;
    this.endpoint = endpoint;
    this.retryDelayMs = retryDelayMs;
  }

  assertConfigured() {
    if (!this.apiKey) throw new LinearClientError("LINEAR_API_KEY is not configured.");
  }

  async graphql(query, variables = {}, { retries = 1 } = {}) {
    this.assertConfigured();
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: this.apiKey,
        },
        body: JSON.stringify({ query, variables }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 429 && attempt < retries) {
        const retryAfter = Number(response.headers?.get?.("retry-after") || 0);
        await sleep(retryAfter ? retryAfter * 1000 : this.retryDelayMs * (attempt + 1));
        continue;
      }
      if (!response.ok) {
        throw new LinearClientError(`Linear API request failed: ${response.status} ${response.statusText}`, { status: response.status, details: payload.errors || [] });
      }
      if (payload.errors?.length) {
        throw new LinearClientError(payload.errors.map((error) => error.message).join("; "), { status: response.status, details: payload.errors });
      }
      return payload.data || {};
    }
    throw lastError || new LinearClientError("Linear API request failed after retry.");
  }

  async viewer() {
    const data = await this.graphql("query Viewer { viewer { id name displayName email url } }");
    return mapUser(data.viewer);
  }

  async teams() {
    const data = await this.graphql("query Teams { teams(first: 100) { nodes { id key name } } }");
    return connectionNodes(data.teams).map(mapTeam).filter(Boolean);
  }

  async projects({ teamKey = "" } = {}) {
    const data = await this.graphql("query Projects { projects(first: 250) { nodes { id name state url teams { nodes { id key name } } } } }");
    return connectionNodes(data.projects)
      .map(mapProject)
      .filter(Boolean)
      .filter((project) => !teamKey || project.teamKeys.includes(teamKey));
  }

  async workflowStates({ teamKey = "" } = {}) {
    const data = await this.graphql("query WorkflowStates { workflowStates(first: 250) { nodes { id name type position team { id key name } } } }");
    return connectionNodes(data.workflowStates)
      .map(mapWorkflowState)
      .filter(Boolean)
      .filter((state) => !teamKey || state.team?.key === teamKey);
  }

  issueFilter({ assignee = "me", teamKey = "TRA", stateTypes = OPEN_STATE_TYPES, projectId = "", labelId = "", stateId = "" } = {}, viewerId = "") {
    const filter = {};
    if (assignee === "me" && viewerId) filter.assignee = { id: { eq: viewerId } };
    else if (assignee && assignee !== "all") filter.assignee = { id: { eq: assignee } };
    if (teamKey) filter.team = { key: { eq: teamKey } };
    if (Array.isArray(stateTypes) && stateTypes.length) filter.state = { type: { in: stateTypes } };
    if (stateId) filter.state = { id: { eq: stateId } };
    if (projectId) filter.project = { id: { eq: projectId } };
    if (labelId) filter.labels = { id: { eq: labelId } };
    return filter;
  }

  async issues(options = {}) {
    const viewer = options.assignee === "all" ? null : await this.viewer();
    const filter = this.issueFilter(options, viewer?.id || "");
    const query = `
      query Issues($first: Int!, $after: String, $filter: IssueFilter) {
        issues(first: $first, after: $after, filter: $filter, orderBy: updatedAt) {
          nodes { ${ISSUE_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;
    const first = Math.max(1, Math.min(100, Number(options.first || 50)));
    const pages = Math.max(1, Math.min(10, Number(options.pages || 3)));
    const nodes = [];
    let after = options.after || null;
    let pageInfo = { hasNextPage: false, endCursor: null };
    for (let page = 0; page < pages; page += 1) {
      const data = await this.graphql(query, { first, after, filter });
      nodes.push(...connectionNodes(data.issues));
      pageInfo = data.issues?.pageInfo || pageInfo;
      if (!pageInfo.hasNextPage) break;
      after = pageInfo.endCursor;
    }
    return { issues: nodes.map(mapLinearIssue).filter(Boolean), pageInfo, viewer };
  }

  async issue(id) {
    const query = `
      query Issue($id: String!) {
        issue(id: $id) {
          ${ISSUE_FIELDS}
          comments(first: 100) { nodes { id body createdAt user { id name displayName email url } } }
        }
      }
    `;
    const data = await this.graphql(query, { id });
    return mapLinearIssue(data.issue);
  }

  async createIssue(input = {}) {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { ${ISSUE_FIELDS} }
        }
      }
    `;
    const data = await this.graphql(mutation, { input: compactObject(input) });
    if (!data.issueCreate?.success) throw new LinearClientError("Linear did not create the issue.");
    return mapLinearIssue(data.issueCreate.issue);
  }

  async updateIssue(id, input = {}) {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue { ${ISSUE_FIELDS} }
        }
      }
    `;
    const data = await this.graphql(mutation, { id, input: compactObject(input) });
    if (!data.issueUpdate?.success) throw new LinearClientError("Linear did not update the issue.");
    return mapLinearIssue(data.issueUpdate.issue);
  }

  async addComment(issueId, body) {
    const mutation = `
      mutation AddComment($input: CommentCreateInput!) {
        commentCreate(input: $input) {
          success
          comment { id body createdAt user { id name displayName email url } }
        }
      }
    `;
    const data = await this.graphql(mutation, { input: { issueId, body } });
    if (!data.commentCreate?.success) throw new LinearClientError("Linear did not create the comment.");
    return data.commentCreate.comment;
  }
}

export function groupIssuesByProject(issues = []) {
  const groups = new Map();
  for (const issue of issues) {
    const key = issue.project?.id || "no-project";
    if (!groups.has(key)) groups.set(key, { id: key, name: issue.project?.name || "No project", issues: [] });
    groups.get(key).issues.push(issue);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}
