export function applyDecisionRules({ profile, evidence }) {
  const rules = [];
  const patience = profile.patience || {};
  const risk = profile.risk || {};

  if (patience.leavesIfPricingHidden) {
    const hasPricing = evidence.signals?.hasPricing;
    if (!hasPricing || evidence.signals?.hasForcedSales) {
      rules.push({
        id: "pricing-hidden",
        severity: "high",
        decision: "leave",
        reason: "This profile leaves quickly when pricing is hidden or requires a sales call."
      });
    }
  }

  if (patience.leavesIfDemoMissing) {
    if (!evidence.signals?.hasDemo) {
      rules.push({
        id: "demo-missing",
        severity: "high",
        decision: "hesitate",
        reason: "This profile needs a demo, screenshot, or proof before investing attention."
      });
    }
  }

  if (risk.requiresRefundPolicy) {
    if (!evidence.signals?.hasRefundPolicy) {
      rules.push({
        id: "refund-policy-needed",
        severity: "medium",
        decision: "hesitate",
        reason: "This profile wants refund or cancellation terms before payment."
      });
    }
  }

  if (risk.requiresClearDataPolicy) {
    if (!evidence.signals?.hasDataPolicy) {
      rules.push({
        id: "data-policy-needed",
        severity: "medium",
        decision: "hesitate",
        reason: "This profile needs to understand what happens to their data."
      });
    }
  }

  return rules.map((rule) => ({
    ...rule,
    evidence: evidence.fetched ? `Fetched page evidence from ${evidence.url}.` : "No page evidence; inferred from profile rule."
  }));
}
