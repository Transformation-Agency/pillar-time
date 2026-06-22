import test from "node:test";
import assert from "node:assert/strict";

import { generationProgressViewModel } from "../src/progressViewModel.js";

const steps = [
  { key: "context", name: "Load executive context", status: "done", output: "Executive context loaded" },
  { key: "calendar", name: "Read calendar and meeting prep", status: "active", output: "Working...", detail: "Primary calendars only." },
  { key: "linear", name: "Read Linear work and blockers", status: "pending" },
];

test("generation progress view model identifies current active step and slow working state", () => {
  const view = generationProgressViewModel({ status: "running", steps }, { slowStep: true });

  assert.equal(view.badgeLabel, "Generating");
  assert.equal(view.title, "Read calendar and meeting prep");
  assert.equal(view.message, "Step 2 of 3: Working...");
  assert.equal(view.detail, "Primary calendars only.");
  assert.equal(view.currentIndex, 1);
  assert.equal(view.progress, 45);
  assert.equal(view.progressClassName, "main-progress working");
  assert.deepEqual(view.stepClasses, ["done", "active", ""]);
});

test("generation progress view model preserves exact error text and highlights failed step", () => {
  const view = generationProgressViewModel({
    status: "error",
    error: "Model connector is not ready",
    steps: [
      { key: "context", name: "Load executive context", status: "done" },
      { key: "synthesize", name: "Render executive day brief", status: "error", output: "Model connector is not ready" },
    ],
  });

  assert.equal(view.badgeTone, "warn");
  assert.equal(view.badgeLabel, "Needs attention");
  assert.equal(view.title, "Brief generation stopped.");
  assert.equal(view.message, "Model connector is not ready");
  assert.equal(view.detail, "");
  assert.deepEqual(view.stepClasses, ["done", "error"]);
});

test("generation progress view model renders completed runs as delivered with full progress", () => {
  const view = generationProgressViewModel({
    status: "done",
    steps: [
      { key: "context", name: "Load executive context", status: "done" },
      { key: "deliver", name: "Save artifact and optional outputs", status: "done" },
    ],
  });

  assert.equal(view.badgeTone, "ok");
  assert.equal(view.title, "Brief delivered.");
  assert.equal(view.message, "The new brief was saved and sent to Telegram.");
  assert.equal(view.progress, 100);
  assert.deepEqual(view.stepClasses, ["done", "done"]);
});

test("generation progress view model falls back to known labels and a default step", () => {
  const defaultView = generationProgressViewModel({});
  assert.equal(defaultView.title, "Generating brief");
  assert.equal(defaultView.message, "Step 1 of 1: generating brief.");

  const labeled = generationProgressViewModel({
    status: "running",
    steps: [{ key: "synthesize", name: "Synthesize", status: "active" }],
  }, { labels: { synthesize: "synthesize analyzer output" } });
  assert.equal(labeled.message, "Step 1 of 1: synthesize analyzer output.");
});
