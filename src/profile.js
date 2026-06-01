import { readFile, writeFile } from "node:fs/promises";

export const STARTER_PROFILE = {
  name: "you",
  summary: "A specific user with real taste, budget, patience, and risk preferences.",
  budget: {
    maxImpulseBuyUsd: 20,
    maxResearchBuyUsd: 100
  },
  patience: {
    maxSignupSteps: 3,
    leavesIfPricingHidden: true,
    leavesIfDemoMissing: true
  },
  preferences: {
    likes: ["clear demos", "transparent pricing", "simple UI"],
    dislikes: ["forced signup", "vague AI copy", "unclear outcome"]
  },
  risk: {
    avoidsUnknownPaymentPages: true,
    requiresRefundPolicy: true,
    requiresClearDataPolicy: true
  },
  writingStyle: {
    tone: "direct and specific",
    notes: "Explain concrete reasons for trust, doubt, and drop-off."
  }
};

export async function loadProfile(path) {
  const profile = JSON.parse(await readFile(path, "utf8"));
  validateProfile(profile);
  return profile;
}

export async function initProfile(path) {
  await writeFile(path, JSON.stringify(STARTER_PROFILE, null, 2), { encoding: "utf8", flag: "wx" });
}

export function validateProfile(profile) {
  if (!profile || typeof profile !== "object") throw new Error("Profile must be an object.");
  if (!profile.name) throw new Error("Profile must include name.");
  if (!profile.preferences) throw new Error("Profile must include preferences.");
  if (!profile.patience) throw new Error("Profile must include patience.");
  if (!profile.budget) throw new Error("Profile must include budget.");
  return profile;
}

export function explainProfile(profile) {
  validateProfile(profile);
  const lines = [
    `Profile: ${profile.name}`,
    "",
    profile.summary || "No summary provided.",
    "",
    "Decision shape:",
    `- Impulse budget: $${profile.budget.maxImpulseBuyUsd}`,
    `- Research budget: $${profile.budget.maxResearchBuyUsd}`,
    `- Max signup steps: ${profile.patience.maxSignupSteps}`,
    `- Leaves if pricing hidden: ${Boolean(profile.patience.leavesIfPricingHidden)}`,
    `- Leaves if demo missing: ${Boolean(profile.patience.leavesIfDemoMissing)}`,
    "",
    "Likes:",
    ...(profile.preferences.likes || []).map((item) => `- ${item}`),
    "",
    "Dislikes:",
    ...(profile.preferences.dislikes || []).map((item) => `- ${item}`),
    "",
    "Risk checks:",
    `- Avoids unknown payment pages: ${Boolean(profile.risk?.avoidsUnknownPaymentPages)}`,
    `- Requires refund policy: ${Boolean(profile.risk?.requiresRefundPolicy)}`,
    `- Requires data policy: ${Boolean(profile.risk?.requiresClearDataPolicy)}`,
    "",
    "Voice:",
    `- Tone: ${profile.writingStyle?.tone || "unspecified"}`,
    `- Notes: ${profile.writingStyle?.notes || "unspecified"}`
  ];

  return lines.join("\n");
}
