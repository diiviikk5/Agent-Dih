export function renderBrief({ trace, reportPath }) {
  const result = trace.result || trace.results?.[0]?.result;
  if (!result) throw new Error("Trace does not include a result.");

  const profile = trace.profile || {};
  const target = trace.url || trace.results?.[0]?.url || "unknown";
  const rules = result.ruleHits || [];

  return [
    `# Agent Dih Brief`,
    "",
    `Profile: **${profile.name || "unknown"}**`,
    `Target: ${target}`,
    `Verdict: **${result.verdict}**`,
    `Conversion: **${result.scores.conversion}/100**`,
    "",
    "## Why",
    "",
    ...(rules.length
      ? rules.slice(0, 3).map((rule) => `- ${rule.reason}`)
      : ["- No major profile-specific blockers were triggered."]),
    "",
    "## Scores",
    "",
    `- Fit: ${result.scores.fit}/100`,
    `- Trust: ${result.scores.trust}/100`,
    `- Friction: ${result.scores.friction}/100`,
    "",
    `Full report: ${reportPath}`
  ].join("\n");
}
