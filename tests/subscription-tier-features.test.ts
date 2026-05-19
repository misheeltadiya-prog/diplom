import { describe, expect, it } from "vitest";
import { getAiFeatureFlags, tierSatisfiesFeature } from "@/lib/features";
import {
  boostScoreForPlan,
  maxJobAppliesPerDay,
  normalizeStoredPlanKey,
  stripeMetadataToCanonical,
} from "@/lib/subscription-tier";

describe("subscription-tier", () => {
  it("normalizes legacy DB keys", () => {
    expect(normalizeStoredPlanKey("free")).toBe("basic");
    expect(normalizeStoredPlanKey("business")).toBe("standard");
    expect(normalizeStoredPlanKey("pro")).toBe("premium");
  });

  it("maps Stripe metadata to canonical paid tiers", () => {
    expect(stripeMetadataToCanonical("pro")).toBe("premium");
    expect(stripeMetadataToCanonical("business")).toBe("standard");
    expect(stripeMetadataToCanonical("premium")).toBe("premium");
    expect(stripeMetadataToCanonical("standard")).toBe("standard");
    expect(stripeMetadataToCanonical("basic")).toBeNull();
  });

  it("boost scores order premium > standard > basic", () => {
    expect(boostScoreForPlan("premium")).toBeGreaterThan(boostScoreForPlan("standard"));
    expect(boostScoreForPlan("standard")).toBeGreaterThan(boostScoreForPlan("basic"));
  });

  it("apply limits per tier", () => {
    expect(maxJobAppliesPerDay("basic")).toBe(3);
    expect(maxJobAppliesPerDay("standard")).toBe(10);
    expect(maxJobAppliesPerDay("premium")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("features", () => {
  it("premium unlocks CV screening", () => {
    expect(tierSatisfiesFeature("premium", "ai.cv_screening")).toBe(true);
    expect(tierSatisfiesFeature("standard", "ai.cv_screening")).toBe(false);
  });

  it("AI flags for basic include limited match only", () => {
    const f = getAiFeatureFlags("basic");
    expect(f.ai_resume_helper).toBe(true);
    expect(f.ai_job_match).toBe(false);
    expect(f.ai_job_match_limited).toBe(true);
  });
});
