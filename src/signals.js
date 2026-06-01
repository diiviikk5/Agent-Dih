export function positiveSignals({ profile, pageEvidence }) {
  const signals = [];
  const evidence = pageEvidence || {};

  if (evidence.signals?.hasPricing) {
    signals.push("Pricing appears discoverable.");
  }
  if (evidence.signals?.hasDemo) {
    signals.push("Demo or product proof appears discoverable.");
  }
  if (evidence.signals?.hasDataPolicy) {
    signals.push("Privacy, data, or security language appears present.");
  }

  const likes = profile.preferences?.likes || [];
  const searchable = `${evidence.title || ""} ${evidence.description || ""}`.toLowerCase();
  for (const like of likes) {
    if (searchable.includes(like.toLowerCase())) {
      signals.push(`Page language matches preference: ${like}`);
    }
  }

  return signals;
}
