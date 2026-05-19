import type {
  AiPromptAnalysis,
  FreelancerMatchScore,
  MatchableFreelancer,
  ScoredFreelancer,
} from "./types";
import {
  buildSearchIntentPhrases,
  entityMatchesSearchIntent,
  scoreIntentMatch,
} from "./search-intent";

function scoreFreelancer(freelancer: MatchableFreelancer, intentPhrases: string[]): FreelancerMatchScore {
  const intent = scoreIntentMatch({
    title: freelancer.roleTitle,
    descriptions: [freelancer.shortDescription, freelancer.detailDescription],
    skillTags: freelancer.skills,
    intentPhrases,
  });
  return {
    score: intent.score,
    percentage: intent.percentage,
    matchedSkills: intent.matchedSkills,
    breakdown: { titleHits: intent.titleHits, skillHits: intent.skillHits },
  };
}

function confidenceFromPercentage(p: number): ScoredFreelancer["confidenceLabel"] {
  if (p >= 72) return "Өндөр";
  if (p >= 42) return "Дунд";
  return "Бага";
}

export function matchFreelancersToAnalysis(
  ai: AiPromptAnalysis,
  freelancers: MatchableFreelancer[],
  rawPrompt = "",
): ScoredFreelancer[] {
  const intentPhrases = buildSearchIntentPhrases(ai, rawPrompt);
  const scored = freelancers.map((freelancer) => ({
    freelancer,
    match: scoreFreelancer(freelancer, intentPhrases),
    confidenceLabel: confidenceFromPercentage(0),
  }));
  for (const row of scored) {
    row.confidenceLabel = confidenceFromPercentage(row.match.percentage);
  }
  scored.sort((a, b) => b.match.score - a.match.score || b.match.percentage - a.match.percentage);
  return scored;
}

export function filterStrongFreelancerMatches(
  ai: AiPromptAnalysis,
  scored: ScoredFreelancer[],
  rawPrompt: string,
): ScoredFreelancer[] {
  const intentPhrases = buildSearchIntentPhrases(ai, rawPrompt);
  return scored
    .filter((row) => {
      const intent = scoreIntentMatch({
        title: row.freelancer.roleTitle,
        descriptions: [row.freelancer.shortDescription, row.freelancer.detailDescription],
        skillTags: row.freelancer.skills,
        intentPhrases,
      });
      return entityMatchesSearchIntent(intent);
    })
    .slice(0, 36);
}
