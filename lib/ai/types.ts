/**
 * Structured output from Gemini for job matching.
 * Values are normalized to lowercase English tokens where possible.
 */
export type AiPromptAnalysis = {
  skills: string[];
  category: string;
  level: string;
  workType: string;
};

export type MatchableJob = {
  id: string;
  title: string;
  description: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
  createdAt?: string;
};

export type JobMatchScore = {
  score: number;
  percentage: number;
  matchedSkills: string[];
  breakdown: {
    titleSkillHits: number;
    descriptionSkillHits: number;
    categoryMatch: boolean;
    levelMatch: boolean;
    workTypeMatch: boolean;
  };
};

export type ScoredJob = {
  job: MatchableJob;
  match: JobMatchScore;
  confidenceLabel: "Өндөр" | "Дунд" | "Бага";
};

export type MatchableFreelancer = {
  id: number;
  fullName: string;
  roleTitle: string;
  shortDescription: string;
  detailDescription: string;
  skills: string[];
  priceLabel: string;
  rating: string;
  avatarUrl?: string | null;
  linkedUserId?: number | null;
};

export type FreelancerMatchScore = {
  score: number;
  percentage: number;
  matchedSkills: string[];
  breakdown: {
    titleHits: number;
    skillHits: number;
  };
};

export type ScoredFreelancer = {
  freelancer: MatchableFreelancer;
  match: FreelancerMatchScore;
  confidenceLabel: "Өндөр" | "Дунд" | "Бага";
};

export type AiSearchTarget = "jobs" | "freelancers" | "both";

export const AI_MATCH_HISTORY_KEY = "cwork-ai-match-history-v1";
export const AI_MATCH_MAX_HISTORY = 8;
