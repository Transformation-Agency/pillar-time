import test from "node:test";
import assert from "node:assert/strict";

import {
  connectorMessageTone,
  connectorModalTarget,
  connectorRequest,
  settingsResearchRows,
  toggleCalendarSelection,
} from "../src/settingsConnectors.js";

test("settings research rows reflect connector status and diagnostics", () => {
  const rows = settingsResearchRows({
    connectors: {
      x: { status: "ready" },
      googleCalendar: { status: "needs consent" },
      reddit: { status: "pending credentials" },
      linear: { status: "missing env", credentialStatus: "missing" },
    },
  });

  assert.deepEqual(rows.map((row) => [row.service, row.status, row.connected, row.action || ""]), [
    ["X (Twitter)", "Connected", true, "x"],
    ["Google Calendar", "Needs consent", false, "googleCalendar"],
    ["Reddit", "Needs OAuth", false, "reddit"],
    ["Linear", "Needs env key", false, "linear"],
    ["Web Search", "Available", true, ""],
    ["YouTube", "Available", true, ""],
  ]);

  const disabledLinear = settingsResearchRows({ connectors: { linear: { status: "disabled", credentialStatus: "env" } } })
    .find((row) => row.action === "linear");
  assert.equal(disabledLinear.status, "Disabled");
});

test("settings connector table maps editable rows to proper modals", () => {
  assert.equal(connectorModalTarget("x"), "x");
  assert.equal(connectorModalTarget("googleCalendar"), "googleCalendar");
  assert.equal(connectorModalTarget("reddit"), "reddit");
  assert.equal(connectorModalTarget("linear"), "linear");
  assert.equal(connectorModalTarget(""), "");
  assert.equal(connectorModalTarget("web"), "");
});

test("Google Calendar checkbox selection cannot remove the final calendar", () => {
  assert.deepEqual(toggleCalendarSelection(["primary"], "primary"), ["primary"]);
  assert.deepEqual(toggleCalendarSelection(["primary", "work"], "primary"), ["work"]);
  assert.deepEqual(toggleCalendarSelection(["primary"], "work"), ["primary", "work"]);
});

test("connector request builders target the expected save, test, and disconnect routes", () => {
  assert.deepEqual(connectorRequest("saveX", { apiKey: "x-key" }), {
    url: "/api/connectors/x",
    method: "PATCH",
    body: { apiKey: "x-key", enabled: true },
  });
  assert.deepEqual(connectorRequest("saveReddit", { clientId: "cid" }), {
    url: "/api/connectors/reddit",
    method: "PATCH",
    body: { clientId: "cid", enabled: true },
  });
  assert.deepEqual(connectorRequest("testReddit", { clientId: "cid" }), {
    url: "/api/reddit/test",
    method: "POST",
    body: { clientId: "cid" },
  });
  assert.deepEqual(connectorRequest("enableLinear"), {
    url: "/api/connectors/linear",
    method: "PATCH",
    body: { enabled: true },
  });
  assert.deepEqual(connectorRequest("disableLinear"), {
    url: "/api/connectors/linear",
    method: "PATCH",
    body: { enabled: false },
  });
  assert.deepEqual(connectorRequest("testLinear"), {
    url: "/api/linear/test",
    method: "POST",
    body: {},
  });
  assert.deepEqual(connectorRequest("saveGoogleCalendars", { selectedCalendarIds: ["primary"] }), {
    url: "/api/google-calendar/calendars",
    method: "PATCH",
    body: { selectedCalendarIds: ["primary"] },
  });
  assert.deepEqual(connectorRequest("disconnectGoogleCalendar"), {
    url: "/api/google-calendar/disconnect",
    method: "POST",
    body: {},
  });
  assert.throws(() => connectorRequest("nope"), /Unknown connector action/);
});

test("connector message tone treats diagnostic failures as warnings", () => {
  assert.equal(connectorMessageTone("Reddit OAuth API is ready."), "ok-text");
  assert.equal(connectorMessageTone("Calendar selection saved."), "ok-text");
  assert.equal(connectorMessageTone("Google Calendar disconnected."), "ok-text");
  assert.equal(connectorMessageTone("Missing X bearer token"), "warn-text");
  assert.equal(connectorMessageTone("OAuth state did not match."), "warn-text");
});
