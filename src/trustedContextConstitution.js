export function trustedContextConstitutionView(context = {}) {
  const constitution = context.constitution || {};
  return {
    versionLabel: `Version ${constitution.version || 0}`,
    bodyText: JSON.stringify(constitution.body || {}, null, 2),
  };
}
