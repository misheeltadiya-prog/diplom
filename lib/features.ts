import { type PlanKey, tierRank } from "@/lib/subscription-tier";

/**
 * Нэгж feature түлхүүр — API, permission, UI feature flag-д ашиглана.
 */
export type FeatureKey =
  | "profile.create"
  | "portfolio.upload"
  | "jobs.view"
  | "jobs.apply"
  | "employer.post_job"
  | "chat.applicants"
  | "analytics.dashboard"
  | "ai.resume_helper"
  | "ai.job_match"
  | "ai.job_match_limited"
  | "ai.chat_assistant"
  | "ai.cv_screening"
  | "ai.auto_recommendation"
  | "ai.interview_generator"
  | "search.priority_listing"
  | "job.boost_visibility"
  | "badge.featured_always"
  | "badge.verified_optional";

/** Feature бүрт доод талын tier (энэ ба түүнээс дээш нэвтрэнэ). */
export const FEATURE_MIN_TIER: Partial<Record<FeatureKey, PlanKey>> = {
  "chat.applicants": "standard",
  "ai.job_match": "standard",
  "ai.chat_assistant": "standard",
  "ai.cv_screening": "premium",
  "ai.auto_recommendation": "premium",
  "ai.interview_generator": "premium",
  "search.priority_listing": "premium",
  "job.boost_visibility": "premium",
  "badge.featured_always": "premium",
  "badge.verified_optional": "standard",
};

export function tierSatisfiesFeature(tier: PlanKey, feature: FeatureKey): boolean {
  const min = FEATURE_MIN_TIER[feature];
  if (!min) return true;
  return tierRank(tier) >= tierRank(min);
}

export type AiFeatureFlags = {
  ai_resume_helper: boolean;
  ai_job_match: boolean;
  ai_job_match_limited: boolean;
  ai_chat_assistant: boolean;
  ai_cv_screening: boolean;
  ai_auto_recommendation: boolean;
  ai_interview_generator: boolean;
};

export function getAiFeatureFlags(tier: PlanKey): AiFeatureFlags {
  const r = tierRank(tier);
  return {
    ai_resume_helper: true,
    ai_job_match: r >= tierRank("standard"),
    ai_job_match_limited: tier === "basic",
    ai_chat_assistant: r >= tierRank("standard"),
    ai_cv_screening: tier === "premium",
    ai_auto_recommendation: tier === "premium",
    ai_interview_generator: tier === "premium",
  };
}
