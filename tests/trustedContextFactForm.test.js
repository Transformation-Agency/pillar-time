import test from "node:test";
import assert from "node:assert/strict";

import {
  trustedContextFactAfterSave,
  trustedContextFactDefaultForm,
  trustedContextFactSavePlan,
} from "../src/trustedContextFactForm.js";

test("Trusted Context fact form starts with verified preferred-name defaults", () => {
  assert.deepEqual(trustedContextFactDefaultForm, {
    resourceType: "identity.profile",
    fieldKey: "preferredName",
    value: "",
    partition: "professional",
    visibility: "assistant",
    trustLevel: "verified_canonical_profile",
    verificationStatus: "verified",
  });
});

test("Trusted Context fact save plan trims payloads and blocks empty required fields", () => {
  assert.deepEqual(trustedContextFactSavePlan({
    resourceType: " identity.profile ",
    fieldKey: " preferredName ",
    value: "  Test Operator  ",
    partition: "professional",
    visibility: "workspace",
  }), {
    ok: true,
    message: "",
    body: {
      resourceType: "identity.profile",
      fieldKey: "preferredName",
      value: "Test Operator",
      partition: "professional",
      visibility: "workspace",
    },
  });

  assert.deepEqual(trustedContextFactSavePlan({ fieldKey: " ", value: "x" }), {
    ok: false,
    message: "Field key is required.",
    body: { fieldKey: "", resourceType: "profile.fact", value: "x" },
  });

  assert.deepEqual(trustedContextFactSavePlan({ fieldKey: "preferredName", value: " " }), {
    ok: false,
    message: "Value is required.",
    body: { fieldKey: "preferredName", resourceType: "profile.fact", value: "" },
  });
});

test("Trusted Context fact form clears only the value after a successful save", () => {
  assert.deepEqual(trustedContextFactAfterSave({
    resourceType: "profile.preference",
    fieldKey: "workStyle",
    value: "Focus blocks first.",
    partition: "professional",
  }), {
    resourceType: "profile.preference",
    fieldKey: "workStyle",
    value: "",
    partition: "professional",
  });
});
