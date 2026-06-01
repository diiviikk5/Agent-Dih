export function recommendations(result) {
  const recs = [];
  const ruleIds = new Set((result.ruleHits || []).map((rule) => rule.id));

  if (ruleIds.has("pricing-hidden")) {
    recs.push("Make pricing or a pricing range visible before signup.");
  }
  if (ruleIds.has("demo-missing")) {
    recs.push("Show a real product demo, screenshot, or example outcome above the fold.");
  }
  if (ruleIds.has("refund-policy-needed")) {
    recs.push("Add cancellation or refund terms near the buying decision.");
  }
  if (ruleIds.has("data-policy-needed")) {
    recs.push("Surface privacy, data handling, or security language earlier.");
  }
  if (result.scores.friction > 65) {
    recs.push("Reduce decision friction before asking the user to commit.");
  }

  return recs.slice(0, 5);
}
