export const trustedContextFactDefaultForm = {
  resourceType: "identity.profile",
  fieldKey: "preferredName",
  value: "",
  partition: "professional",
  visibility: "assistant",
  trustLevel: "verified_canonical_profile",
  verificationStatus: "verified",
};

export function trustedContextFactSavePlan(form = {}) {
  const body = {
    ...form,
    resourceType: String(form.resourceType || "profile.fact").trim(),
    fieldKey: String(form.fieldKey || "").trim(),
    value: String(form.value || "").trim(),
  };
  if (!body.fieldKey) return { ok: false, message: "Field key is required.", body };
  if (!body.value) return { ok: false, message: "Value is required.", body };
  return { ok: true, message: "", body };
}

export function trustedContextFactAfterSave(form = {}) {
  return { ...form, value: "" };
}
