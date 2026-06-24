import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const serverSource = fs.readFileSync(new URL("../server/index.js", import.meta.url), "utf8");
const tauriSource = fs.readFileSync(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");
const envExample = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const mainSource = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("Pillar Time runtime uses a dedicated backend port", () => {
  assert.match(serverSource, /process\.env\.PORT \|\| 42818/);
  assert.match(tauriSource, /const BACKEND_PORT: u16 = 42818;/);
  assert.doesNotMatch(envExample, /PORT=42817/);
  assert.match(envExample, /PORT=42818/);
});

test("Pillar Time does not inherit shared Pillar app runtime variables", () => {
  for (const source of [serverSource, tauriSource, envExample]) {
    assert.doesNotMatch(source, /PILLAR_APP_MODE/);
    assert.doesNotMatch(source, /PILLAR_DESKTOP/);
    assert.doesNotMatch(source, /PILLAR_BACKEND_DIR/);
    assert.doesNotMatch(source, /PILLAR_DATA_DIR/);
    assert.doesNotMatch(source, /PILLAR_DB_PATH/);
    assert.doesNotMatch(source, /PILLAR_GOOGLE_CALENDAR_/);
    assert.doesNotMatch(source, /PILLAR_REDDIT_/);
    assert.doesNotMatch(source, /(?<!PILLAR_TIME_)REDDIT_CLIENT_ID/);
    assert.doesNotMatch(source, /(?<!PILLAR_TIME_)REDDIT_CLIENT_SECRET/);
  }
});

test("Today generation defaults to executive day planning instead of intelligence", () => {
  assert.match(serverSource, /executeExecutiveDayWorkflow/);
  assert.match(serverSource, /req\.body\?\.runType === "intelligence" \? "intelligence" : "executive_day"/);
  assert.match(mainSource, /Generate Day Plan/);
  assert.match(mainSource, /runWorkflow\(\{ runType: "executive_day" \}\)/);
  assert.match(mainSource, /runWorkflow\(\{ runType: "intelligence" \}\)/);
});

test("Executive day runs and Today view stay separated from intelligence artifacts", () => {
  assert.match(serverSource, /run_type TEXT NOT NULL DEFAULT 'intelligence'/);
  assert.match(serverSource, /run_type='executive_day'/);
  assert.match(serverSource, /latestCompletedExecutiveArtifact/);
  assert.doesNotMatch(serverSource, /WHERE s\.type='Calendar' AND ni\.published_at/);
  assert.match(mainSource, /latestExecutiveArtifact/);
  assert.match(mainSource, /runType === "executive_day" \? "today" : "briefs"/);
});

test("Executive calendar proposals are approval-gated and surfaced in Today", () => {
  assert.match(serverSource, /calendar\.proposed_schedule/);
  assert.match(serverSource, /app\.post\("\/api\/approvals\/:id\/execute"/);
  assert.match(serverSource, /Reconnect Google Calendar to allow approved schedule writes/);
  assert.match(mainSource, /ProposedCalendarTiles/);
  assert.match(mainSource, /Approve Calendar/);
  assert.match(mainSource, /Add Context & Regenerate/);
  assert.match(mainSource, /identity\.self_statement/);
  assert.match(mainSource, /profile\.standing_commitment/);
});

test("Linear connector cannot be falsely enabled without credentials", () => {
  assert.match(serverSource, /res\.status\(400\)\.json\(\{ error: message, state: state\(\) \}\)/);
  assert.match(serverSource, /Paste a Linear personal API key, or configure LINEAR_API_KEY before enabling Linear\./);
  assert.match(mainSource, /Paste a Linear personal API key, or skip Linear for now\./);
  assert.match(mainSource, /Paste a Linear personal API key, or leave Linear disabled for now\./);
});

test("Onboarding explains setup context and avoids stale recovery copy", () => {
  assert.match(mainSource, /Protect deep work before noon/);
  assert.match(mainSource, /Why Google may show Transformation Agency/);
  assert.match(mainSource, /Google Calendar is connected\./);
  assert.match(mainSource, /This can be daily or weekly\. You can change it later from Settings\./);
  assert.match(mainSource, /Fix required step/);
  assert.doesNotMatch(mainSource, /change it later from the home screen/);
});

test("First-run controls avoid misleading defaults and internal labels", () => {
  assert.match(mainSource, /const defaultOpenAiModel = "gpt-4\.1"/);
  assert.doesNotMatch(mainSource, /gpt-5\.4-mini/);
  assert.match(mainSource, /function displayCadence/);
  assert.match(mainSource, /Master reminders are off/);
  assert.match(mainSource, /Quiet by default/);
  assert.match(mainSource, /is-gated/);
});
