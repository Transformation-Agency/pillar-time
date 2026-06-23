const defaultNames = new Set(["", "you", "brief owner", "the brief owner"]);

export function isDefaultOwnerName(name) {
  return defaultNames.has(String(name || "").trim().toLowerCase());
}

export function onboardingReviewReadiness({ readiness = {}, firstName = "", savedOwnerName = "" } = {}) {
  return {
    ...readiness,
    ownerNameReady: !isDefaultOwnerName(String(firstName || "").trim() || savedOwnerName),
  };
}

export function canCompleteOnboarding(readiness = {}) {
  return !!(readiness.ownerNameReady && readiness.scheduleSet);
}

export function firstIncompleteOnboardingStep(readiness = {}) {
  if (!readiness.ownerNameReady) return "welcome";
  if (!readiness.scheduleSet) return "schedule";
  return "review";
}

export function initialOnboardingStep({ savedOwnerName = "", currentStep = "", readiness = {} } = {}) {
  const hasSavedFirstName = !isDefaultOwnerName(savedOwnerName);
  if (!hasSavedFirstName) return "welcome";
  if (currentStep === "complete") return firstIncompleteOnboardingStep({ ...readiness, ownerNameReady: true });
  return currentStep || "welcome";
}

export function deliverySaveRequest({ currentConfig = {}, timezone = "America/Denver", patch = {} } = {}) {
  return {
    url: "/api/brief-config",
    method: "PATCH",
    body: {
      ...currentConfig,
      deliveryTimezone: timezone,
      ...patch,
    },
  };
}

export function onboardingCompleteRequest() {
  return {
    url: "/api/onboarding/complete",
    body: {},
  };
}
