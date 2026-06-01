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
