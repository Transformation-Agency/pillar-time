export const modelProviders = ["openai", "anthropic", "openrouter", "gemini", "xai", "custom"];
export const defaultOpenAiModel = "gpt-4.1";

export function normalizeModelProvider(provider = "") {
  return modelProviders.includes(provider) ? provider : "openai";
}

export function defaultModelForProvider(provider = "") {
  const normalized = normalizeModelProvider(provider);
  if (normalized === "openai") return defaultOpenAiModel;
  if (normalized === "xai") return "grok-4.3";
  return "";
}

export function providerCredentialStatus({ savedApiKey = "", envApiKey = "" } = {}) {
  if (savedApiKey) return "saved";
  return envApiKey ? "env" : "missing";
}

export function modelProviderCredentialKey(provider = "") {
  return `model:${normalizeModelProvider(provider)}`;
}

export function modelBaseUrl({ provider = "openai", baseUrl = "" } = {}) {
  const normalized = normalizeModelProvider(provider);
  if (normalized === "custom") return String(baseUrl || "").replace(/\/+$/, "");
  if (normalized === "openrouter") return "https://openrouter.ai/api/v1";
  if (normalized === "anthropic") return "https://api.anthropic.com/v1";
  if (normalized === "gemini") return "https://generativelanguage.googleapis.com/v1beta";
  if (normalized === "xai") return "https://api.x.ai/v1";
  return "https://api.openai.com/v1";
}

export function modelSavePlan({ provider = "openai", model = "", apiKey = "", savedApiKey = "", enabled = true, baseUrl = "", envApiKey = "" } = {}) {
  const normalized = normalizeModelProvider(provider);
  const nextBaseUrl = normalized === "custom" ? String(baseUrl || "").trim().replace(/\/+$/, "") : "";
  const runtimeKey = apiKey || savedApiKey || envApiKey;
  const modelName = model || defaultModelForProvider(normalized);
  const credentialStatus = providerCredentialStatus({ savedApiKey: runtimeKey });
  const missing = !!enabled && (!modelName || credentialStatus === "missing" || (normalized === "custom" && !nextBaseUrl));
  return {
    provider: normalized,
    model: modelName,
    apiKey: apiKey || savedApiKey,
    baseUrl: nextBaseUrl,
    enabled: !!enabled,
    credentialStatus,
    missing,
    lastError: missing ? "Missing runtime provider key, model name, or custom Base URL" : "",
  };
}

export function modelSettingsView({ row = {}, activeProviderKey = "", providerCredentials = {} } = {}) {
  const provider = normalizeModelProvider(row.provider);
  const customReady = provider !== "custom" || !!row.base_url;
  const credentialStatus = providerCredentialStatus({ savedApiKey: activeProviderKey });
  return {
    provider,
    model: row.model || "",
    apiKeySaved: !!activeProviderKey,
    baseUrl: provider === "custom" ? row.base_url || "" : "",
    enabled: !!row.enabled,
    credentialStatus,
    status: row.enabled && row.model && customReady && credentialStatus !== "missing" ? "ready" : "pending credentials",
    providerCredentials,
    lastCheckedAt: row.last_checked_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  };
}

export function parseProviderModelList(provider = "openai", payload = {}) {
  const normalized = normalizeModelProvider(provider);
  const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.models) ? payload.models : [];
  return data
    .filter((item) => normalized !== "gemini" || (item.supportedGenerationMethods || []).includes("generateContent"))
    .map((item) => item.id || item.name || item.model)
    .filter(Boolean)
    .map((name) => String(name).replace(/^models\//, ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
