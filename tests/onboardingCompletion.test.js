import test from "node:test";
import assert from "node:assert/strict";

import {
  canCompleteOnboarding,
  deliverySaveRequest,
  firstIncompleteOnboardingStep,
  initialOnboardingStep,
  isDefaultOwnerName,
  onboardingCompleteRequest,
  onboardingReviewReadiness,
} from "../src/onboardingCompletion.js";

test("onboarding completion requires a non-default owner name and schedule", () => {
  assert.equal(isDefaultOwnerName("You"), true);
  assert.equal(isDefaultOwnerName("brief owner"), true);
  assert.equal(isDefaultOwnerName("Avery"), false);

  const missingName = onboardingReviewReadiness({
    readiness: { scheduleSet: true },
    firstName: "",
    savedOwnerName: "You",
  });
  assert.equal(missingName.ownerNameReady, false);
  assert.equal(canCompleteOnboarding(missingName), false);

  const ready = onboardingReviewReadiness({
    readiness: { scheduleSet: true },
    firstName: "Avery",
    savedOwnerName: "You",
  });
  assert.equal(ready.ownerNameReady, true);
  assert.equal(canCompleteOnboarding(ready), true);
});

test("onboarding first incomplete step sends users to required setup only", () => {
  assert.equal(firstIncompleteOnboardingStep({ ownerNameReady: false, scheduleSet: false }), "welcome");
  assert.equal(firstIncompleteOnboardingStep({ ownerNameReady: true, scheduleSet: false }), "schedule");
  assert.equal(firstIncompleteOnboardingStep({ ownerNameReady: true, scheduleSet: true }), "review");
});

test("onboarding initial step reopens completed setup at missing required step", () => {
  assert.equal(initialOnboardingStep({
    savedOwnerName: "You",
    currentStep: "complete",
    readiness: { scheduleSet: true },
  }), "welcome");

  assert.equal(initialOnboardingStep({
    savedOwnerName: "Avery",
    currentStep: "complete",
    readiness: { scheduleSet: false },
  }), "schedule");

  assert.equal(initialOnboardingStep({
    savedOwnerName: "Avery",
    currentStep: "complete",
    readiness: { scheduleSet: true },
  }), "review");

  assert.equal(initialOnboardingStep({
    savedOwnerName: "Avery",
    currentStep: "telegram",
    readiness: { scheduleSet: true },
  }), "telegram");
});

test("onboarding delivery save request preserves existing config and applies schedule patch", () => {
  assert.deepEqual(deliverySaveRequest({
    currentConfig: {
      ownerName: "Avery",
      deliveryFrequency: "Daily",
      deliveryTime: "08:00",
      deliveryTimezone: "America/Denver",
    },
    timezone: "America/Denver",
    patch: {
      deliveryFrequency: "Weekly",
      deliveryDay: "Monday",
      deliveryTime: "07:30",
    },
  }), {
    url: "/api/brief-config",
    method: "PATCH",
    body: {
      ownerName: "Avery",
      deliveryFrequency: "Weekly",
      deliveryTime: "07:30",
      deliveryTimezone: "America/Denver",
      deliveryDay: "Monday",
    },
  });
});

test("onboarding completion request uses the server-side completion gate endpoint", () => {
  assert.deepEqual(onboardingCompleteRequest(), {
    url: "/api/onboarding/complete",
    body: {},
  });
});
