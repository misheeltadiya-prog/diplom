/**
 * Subscription tiers (C-Work style). DB-д `basic` | `standard` | `premium` хадгална.
 * Legacy Stripe/DB: free→basic, business→standard ($20), pro→premium ($100).
 */
export type PlanKey = "basic" | "standard" | "premium";

const TIER_ORDER: Record<PlanKey, number> = {
  basic: 0,
  standard: 1,
  premium: 2,
};

export function tierRank(tier: PlanKey): number {
  return TIER_ORDER[tier] ?? 0;
}

export function normalizeStoredPlanKey(raw: string | null | undefined): PlanKey {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "premium" || s === "pro") return "premium";
  if (s === "standard" || s === "business") return "standard";
  if (s === "basic" || s === "free") return "basic";
  return "basic";
}

/** Stripe Checkout metadata `plan_key` → DB canonical */
export function stripeMetadataToCanonical(raw: string | null | undefined): PlanKey | null {
  const s = (raw ?? "").toLowerCase().trim();
  if (s === "pro" || s === "premium") return "premium";
  if (s === "business" || s === "standard") return "standard";
  return null;
}

export function isPaidTier(tier: PlanKey): boolean {
  return tier === "standard" || tier === "premium";
}

export function boostScoreForPlan(tier: PlanKey): number {
  if (tier === "premium") return 100;
  if (tier === "standard") return 50;
  return 10;
}

export function maxActiveJobsForEmployer(tier: PlanKey): number {
  if (tier === "premium") return Number.POSITIVE_INFINITY;
  if (tier === "standard") return 10;
  return 3;
}

export function maxPortfolioItems(tier: PlanKey): number {
  if (tier === "premium" || tier === "standard") return 50;
  return 3;
}

export function maxJobAppliesPerDay(tier: PlanKey): number {
  if (tier === "premium") return Number.POSITIVE_INFINITY;
  if (tier === "standard") return 10;
  return 3;
}
