import test from "node:test";
import assert from "node:assert/strict";

import { addedContextItemsForRender, approvalQueueItemsForRender } from "../server/executiveBriefRender.js";

test("approval queue render prefers actual approval items over stale empty synthesis text", () => {
  assert.deepEqual(approvalQueueItemsForRender({
    brief: { approvalRead: [] },
    artifact: {
      approvalItems: [{
        title: "Fill 1 Pillar Time calendar block for 2026-06-22",
        kind: "calendar_schedule",
        status: "pending",
      }],
    },
  }), ["Fill 1 Pillar Time calendar block for 2026-06-22 (pending)"]);
});

test("approval queue render falls back to synthesis text when no action was created", () => {
  assert.deepEqual(approvalQueueItemsForRender({
    brief: { approvalRead: ["No pending approvals from connected systems."] },
    artifact: { approvalItems: [] },
  }), ["No pending approvals from connected systems."]);
});

test("added context render keeps user corrections visible in regenerated briefs", () => {
  assert.deepEqual(addedContextItemsForRender({
    basedOnRunId: "run-original",
    additionalContext: "  Protect a second follow-up block.  ",
  }), ["Regenerated from run-original: Protect a second follow-up block."]);

  assert.deepEqual(addedContextItemsForRender({ additionalContext: "" }), []);
});
