import test from "node:test";
import assert from "node:assert/strict";

import { executeApprovalAction } from "../server/approvalExecutor.js";

test("approval executor refuses to touch connectors before approval", async () => {
  let called = false;
  await assert.rejects(() => executeApprovalAction({
    id: "approval-1",
    kind: "linear_action",
    status: "pending",
  }, {
    payload: { operation: "addComment", issueId: "issue-1", body: "hello" },
    linearClient: {
      addComment: async () => {
        called = true;
      },
    },
  }), /Approve this action before executing it/);
  assert.equal(called, false);
});

test("approval executor executes Linear comments and verifies when requested", async () => {
  const calls = [];
  const executed = await executeApprovalAction({
    id: "approval-2",
    kind: "linear_action",
    status: "approved",
  }, {
    by: "test",
    payload: {
      operation: "addComment",
      issueId: "issue-1",
      body: "What is blocked?",
      verification: { refetchIssue: true },
    },
    linearClient: {
      addComment: async (issueId, body) => {
        calls.push(["addComment", issueId, body]);
        return { id: "comment-1", body };
      },
      issue: async (issueId) => {
        calls.push(["issue", issueId]);
        return { id: issueId, title: "Verified issue" };
      },
    },
  });

  assert.deepEqual(calls, [
    ["addComment", "issue-1", "What is blocked?"],
    ["issue", "issue-1"],
  ]);
  assert.equal(executed.result.operation, "addComment");
  assert.equal(executed.result.comment.id, "comment-1");
  assert.equal(executed.result.issue.title, "Verified issue");
  assert.equal(executed.resolutionNote, "Executed addComment and verified with Linear.");
  assert.equal(executed.auditSummary, "Executed Linear addComment");
});

test("approval executor validates Linear create and update payloads before calling connector", async () => {
  const client = {
    updateIssue: async () => assert.fail("updateIssue should not be called"),
    createIssue: async () => assert.fail("createIssue should not be called"),
  };
  await assert.rejects(() => executeApprovalAction({
    id: "approval-3",
    kind: "linear_action",
    status: "approved",
  }, {
    payload: { operation: "updateIssue", issueId: "issue-1" },
    linearClient: client,
  }), /missing issueId or input/);

  await assert.rejects(() => executeApprovalAction({
    id: "approval-4",
    kind: "linear_action",
    status: "approved",
  }, {
    payload: { operation: "createIssue", input: { title: "Missing team" } },
    linearClient: client,
  }), /missing teamId or title/);
});

test("approval executor executes Google Calendar schedule blocks with approval metadata", async () => {
  const calls = [];
  const executed = await executeApprovalAction({
    id: "approval-calendar",
    kind: "calendar_schedule",
    status: "approved",
  }, {
    by: "test",
    payload: {
      operation: "createScheduleBlocks",
      calendarId: "selected",
      timezone: "America/Denver",
      blocks: [
        {
          id: "block-1",
          categoryId: "schedule-category-deep-work",
          title: "Write memo",
          summary: "Pillar Time: Focus - Write memo",
          description: "Created from proposal.",
          start: "2026-06-22T15:00:00.000Z",
          end: "2026-06-22T16:00:00.000Z",
        },
      ],
    },
    createGoogleCalendarEvent: async (request) => {
      calls.push(request);
      return { id: "event-1", htmlLink: "https://calendar/event-1", summary: request.summary, start: request.start, end: request.end };
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    calendarId: "selected",
    summary: "Pillar Time: Focus - Write memo",
    description: "Created from proposal.",
    start: "2026-06-22T15:00:00.000Z",
    end: "2026-06-22T16:00:00.000Z",
    timezone: "America/Denver",
    extendedProperties: {
      pillarTimeApprovalId: "approval-calendar",
      pillarTimeBlockId: "block-1",
      pillarTimeCategoryId: "schedule-category-deep-work",
    },
  });
  assert.equal(executed.result.createdEvents[0].id, "event-1");
  assert.equal(executed.resolutionNote, "Created 1 Google Calendar event.");
  assert.equal(executed.auditSummary, "Executed Google Calendar schedule approval");
});

test("approval executor rejects unsupported approval kinds and operations", async () => {
  await assert.rejects(() => executeApprovalAction({
    id: "approval-unsupported",
    kind: "unknown",
    status: "approved",
  }, { payload: {} }), /Unsupported approval kind/);

  await assert.rejects(() => executeApprovalAction({
    id: "approval-linear",
    kind: "linear_action",
    status: "approved",
  }, {
    payload: { operation: "deleteIssue" },
    linearClient: {},
  }), /Unsupported Linear approval operation/);

  await assert.rejects(() => executeApprovalAction({
    id: "approval-calendar",
    kind: "calendar_schedule",
    status: "approved",
  }, {
    payload: { operation: "createScheduleBlocks", blocks: [] },
    createGoogleCalendarEvent: async () => assert.fail("calendar should not be called"),
  }), /no blocks to create/);
});
