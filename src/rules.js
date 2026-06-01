export function applyDecisionRules({ profile, evidence }) {
  const rules = [];
  const patience = profile.patience || {};
  const risk = profile.risk || {};

  if (patience.leavesIfPricingHidden) {
    rules.push({
      id: "pricing-hidden",
      severity: "high",
      decision: "leave",
      reason: "This profile leaves quickly when pricing is hidden or requires a sales call."
    });
  }

  if (patience.leavesIfDemoMissing) {
    rules.push({
      id: "demo-missing",
      severity: "high",
      decision: "hesitate",
      reason: "This profile needs a demo, screenshot, or proof before investing attention."
    });
  }

  if (risk.requiresRefundPolicy) {
    rules.push({
      id: "refund-policy-needed",
      severity: "medium",
      decision: "hesitate",
      reason: "This profile wants refund or cancellation terms before payment."
    });
  }

  if (risk.requiresClearDataPolicy) {
    rules.push({
      id: "data-policy-needed",
      severity: "medium",
      decision: "hesitate",
      reason: "This profile needs to understand what happens to their data."
    });
  }

  return rules.map((rule) => ({
    ...rule,
    evidence: evidence[rule.id] || "No live browser evidence yet; inferred from profile rule."
  }));
}
