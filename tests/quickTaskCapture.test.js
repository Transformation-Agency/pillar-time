import test from "node:test";
import assert from "node:assert/strict";

import {
  quickTaskCaptureRequest,
  submitQuickTaskCapture,
} from "../src/quickTaskCapture.js";

test("quick task capture blocks blank submissions before hitting the API", async () => {
  const calls = [];
  const result = await submitQuickTaskCapture({
    value: "   ",
    mutate: async () => calls.push("mutate"),
  });

  assert.deepEqual(result, {
    ok: false,
    clearInput: false,
    message: "Add a task or obligation first.",
  });
  assert.deepEqual(calls, []);
});

test("quick task capture trims title and saves an inbox task from Today", async () => {
  const calls = [];
  const result = await submitQuickTaskCapture({
    value: "  Call Diana about launch blockers  ",
    mutate: async (url, body, method) => calls.push([url, body, method]),
  });

  assert.deepEqual(result, {
    ok: true,
    clearInput: true,
    message: "",
    title: "Call Diana about launch blockers",
  });
  assert.deepEqual(calls, [[
    "/api/time/tasks",
    {
      title: "Call Diana about launch blockers",
      source: "quick-capture",
    },
    "POST",
  ]]);
});

test("quick task capture request exposes the exact task payload", () => {
  assert.deepEqual(quickTaskCaptureRequest("Ship user story tracker"), {
    ok: true,
    url: "/api/time/tasks",
    method: "POST",
    body: {
      title: "Ship user story tracker",
      source: "quick-capture",
    },
  });
});

test("quick task capture preserves input when persistence fails", async () => {
  const result = await submitQuickTaskCapture({
    value: "Draft release note",
    mutate: async () => {
      throw new Error("Task title is required.");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    clearInput: false,
    message: "Task title is required.",
  });
});
