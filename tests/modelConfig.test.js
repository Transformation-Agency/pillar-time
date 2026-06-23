import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultModelForProvider,
  modelBaseUrl,
  modelProviderCredentialKey,
  modelSavePlan,
  modelSettingsView,
  normalizeModelProvider,
  parseProviderModelList,
  providerCredentialStatus,
} from "../server/modelConfig.js";

test("model provider setup normalizes providers and defaults only where configured", () => {
  assert.equal(normalizeModelProvider("openai"), "openai");
  assert.equal(normalizeModelProvider("xai"), "xai");
  assert.equal(normalizeModelProvider("bogus"), "openai");
  assert.equal(defaultModelForProvider("openai"), "gpt-4.1");
  assert.equal(defaultModelForProvider("xai"), "grok-4.3");
  assert.equal(defaultModelForProvider("anthropic"), "");
  assert.equal(modelProviderCredentialKey("gemini"), "model:gemini");
  assert.equal(modelProviderCredentialKey("bogus"), "model:openai");
});

test("model credential status distinguishes saved, env, and missing keys", () => {
  assert.equal(providerCredentialStatus({ savedApiKey: "saved" }), "saved");
  assert.equal(providerCredentialStatus({ envApiKey: "env" }), "env");
  assert.equal(providerCredentialStatus({}), "missing");
});

test("model save plan validates enabled model setup without live provider calls", () => {
  assert.deepEqual(modelSavePlan({
    provider: "openai",
    enabled: true,
    apiKey: "sk-test",
  }), {
    provider: "openai",
    model: "gpt-4.1",
    apiKey: "sk-test",
    baseUrl: "",
    enabled: true,
    credentialStatus: "saved",
    missing: false,
    lastError: "",
  });

  assert.equal(modelSavePlan({ provider: "anthropic", enabled: true, savedApiKey: "key", model: "claude-sonnet" }).missing, false);
  assert.equal(modelSavePlan({ provider: "anthropic", enabled: true, savedApiKey: "key" }).missing, true);
  assert.equal(modelSavePlan({ provider: "custom", enabled: true, savedApiKey: "key", model: "local-model" }).lastError, "Missing runtime provider key, model name, or custom Base URL");
  assert.equal(modelSavePlan({ provider: "custom", enabled: true, savedApiKey: "key", model: "local-model", baseUrl: " http://localhost:11434/v1/// " }).baseUrl, "http://localhost:11434/v1");
  assert.equal(modelSavePlan({ provider: "openai", enabled: false }).missing, false);
});

test("model settings view reports readiness without exposing provider keys", () => {
  const view = modelSettingsView({
    row: {
      provider: "custom",
      model: "local-model",
      base_url: "http://localhost:11434/v1",
      enabled: 1,
      last_checked_at: "2026-06-22T10:00:00.000Z",
      last_error: "",
      updated_at: "2026-06-22T10:00:00.000Z",
    },
    activeProviderKey: "secret",
    providerCredentials: { custom: { apiKeySaved: true, credentialStatus: "saved" } },
  });

  assert.equal(view.status, "ready");
  assert.equal(view.apiKeySaved, true);
  assert.equal(view.baseUrl, "http://localhost:11434/v1");
  assert.deepEqual(view.providerCredentials.custom, { apiKeySaved: true, credentialStatus: "saved" });
  assert.equal(Object.hasOwn(view, "apiKey"), false);

  assert.equal(modelSettingsView({ row: { provider: "custom", model: "local-model", enabled: 1 }, activeProviderKey: "secret" }).status, "pending credentials");
});

test("model discovery parsing normalizes OpenAI-compatible and Gemini payloads", () => {
  assert.deepEqual(parseProviderModelList("openai", {
    data: [{ id: "gpt-b" }, { id: "gpt-a" }, { name: "named-model" }, {}],
  }), ["gpt-a", "gpt-b", "named-model"]);

  assert.deepEqual(parseProviderModelList("gemini", {
    models: [
      { name: "models/gemini-pro", supportedGenerationMethods: ["generateContent"] },
      { name: "models/embedder", supportedGenerationMethods: ["embedContent"] },
    ],
  }), ["gemini-pro"]);
});

test("model runtime base URLs are provider-specific and custom URLs are trimmed", () => {
  assert.equal(modelBaseUrl({ provider: "openai" }), "https://api.openai.com/v1");
  assert.equal(modelBaseUrl({ provider: "anthropic" }), "https://api.anthropic.com/v1");
  assert.equal(modelBaseUrl({ provider: "openrouter" }), "https://openrouter.ai/api/v1");
  assert.equal(modelBaseUrl({ provider: "gemini" }), "https://generativelanguage.googleapis.com/v1beta");
  assert.equal(modelBaseUrl({ provider: "xai" }), "https://api.x.ai/v1");
  assert.equal(modelBaseUrl({ provider: "custom", baseUrl: "http://localhost:1234/v1///" }), "http://localhost:1234/v1");
});
