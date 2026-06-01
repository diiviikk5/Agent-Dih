export function evaluateFallback({ url, goal, profile }) {
  const urlText = url.toLowerCase();
  const goalText = goal.toLowerCase();
  const likes = profile.preferences?.likes || [];
  const dislikes = profile.preferences?.dislikes || [];

  const signals = [];
  const concerns = [];

  for (const like of likes) {
    if (goalText.includes(like.toLowerCase()) || urlText.includes(tokenize(like)[0] || "")) {
      signals.push(`Matches preference: ${like}`);
    }
  }

  if (profile.patience?.leavesIfPricingHidden) {
    concerns.push("Will drop off quickly if pricing is hidden or gated behind sales.");
  }
  if (profile.patience?.leavesIfDemoMissing) {
    concerns.push("Needs a visible demo or proof before committing attention.");
  }
  if (profile.risk?.requiresRefundPolicy) {
    concerns.push("Needs refund or cancellation policy before payment.");
  }

  const dislikeHits = dislikes.slice(0, 3).map((item) => `Sensitive to: ${item}`);
  const trust = clamp(55 + signals.length * 8 - concerns.length * 3);
  const fit = clamp(50 + signals.length * 10 - dislikeHits.length * 4);
  const friction = clamp(35 + concerns.length * 7);
  const conversion = clamp(Math.round((trust + fit + (100 - friction)) / 3));

  return {
    mode: "fallback",
    scores: {
      fit,
      trust,
      friction,
      conversion
    },
    journey: [
      {
        step: "first-impression",
        thought: `${profile.name} checks whether the page proves value before asking for commitment.`
      },
      {
        step: "trust-check",
        thought: concerns.length > 0 ? concerns[0] : "No immediate trust blocker from the profile rules."
      },
      {
        step: "decision",
        thought: conversion >= 70 ? "Likely to continue." : conversion >= 45 ? "Needs stronger proof." : "Likely to leave."
      }
    ],
    signals,
    concerns: [...concerns, ...dislikeHits],
    verdict: conversion >= 70 ? "continue" : conversion >= 45 ? "hesitate" : "leave"
  };
}

function tokenize(value) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
