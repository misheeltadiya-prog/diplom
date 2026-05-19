import type { AiPromptAnalysis, JobMatchScore, MatchableJob, ScoredJob } from "./types";
import { deriveJobProfile, normalizeToken } from "./job-profile";
import {
  buildSearchIntentPhrases,
  entityMatchesSearchIntent,
  includesLoose,
  scoreIntentMatch,
} from "./search-intent";
import { skillMatchPhrases, userAskedEducationFocus } from "./skill-synonyms";

const MAX_SCORE_REFERENCE = 70;

function jobBlobLower(job: MatchableJob): string {
  return `${job.title}\n${job.description}`.toLowerCase();
}

function educationTermsInBlob(blob: string): boolean {
  return /багш|багшийн|боловсрол|сургууль|teacher|teaching|education|tutor|хичээл|заах|сургалт|сурагч|туслах|assistant/.test(
    blob,
  );
}

function techJobMisalignedWithEducation(ai: AiPromptAnalysis, job: MatchableJob): boolean {
  if (!userAskedEducationFocus(ai.skills, ai.category)) return false;
  const profile = deriveJobProfile(job);
  const techCats = new Set(["frontend", "backend", "mobile", "devops", "qa", "data", "design"]);
  if (!techCats.has(normalizeToken(profile.category))) return false;
  if (educationTermsInBlob(jobBlobLower(job))) return false;
  return true;
}

/** Ажлын нэр (гарчиг) эсвэл хэрэглэгчийн skill зарын гарчиг/тайлбарт таарсан эсэх. */
export function jobMatchesUserIntent(job: MatchableJob, ai: AiPromptAnalysis, rawPrompt: string): boolean {
  const intentPhrases = buildSearchIntentPhrases(ai, rawPrompt);
  const titleL = job.title.toLowerCase();
  const descL = job.description.toLowerCase();

  const fromPrompt = scoreIntentMatch({
    title: job.title,
    descriptions: [job.description],
    skillTags: [],
    intentPhrases,
  });
  if (entityMatchesSearchIntent(fromPrompt)) return true;

  for (const raw of ai.skills) {
    const skill = raw.trim();
    if (!skill) continue;
    for (const phrase of skillMatchPhrases(skill)) {
      if (includesLoose(titleL, phrase) || includesLoose(descL, phrase)) return true;
    }
  }

  if (ai.skills.length === 0 && userAskedEducationFocus([], ai.category) && educationTermsInBlob(jobBlobLower(job))) {
    return true;
  }

  return false;
}

function scoreJob(ai: AiPromptAnalysis, job: MatchableJob, intentPhrases: string[]): JobMatchScore {
  const profile = deriveJobProfile(job);
  const titleL = job.title.toLowerCase();
  const descL = job.description.toLowerCase();

  const promptMatch = scoreIntentMatch({
    title: job.title,
    descriptions: [job.description],
    skillTags: [],
    intentPhrases,
  });

  const matchedSkills: string[] = [];
  let userSkillTitleHits = 0;
  let userSkillDescHits = 0;

  for (const raw of ai.skills) {
    const skill = raw.trim();
    if (!skill) continue;
    let hitTitle = false;
    let hitDesc = false;
    for (const phrase of skillMatchPhrases(skill)) {
      if (includesLoose(titleL, phrase)) {
        hitTitle = true;
        break;
      }
    }
    for (const phrase of skillMatchPhrases(skill)) {
      if (includesLoose(descL, phrase)) {
        hitDesc = true;
        break;
      }
    }
    if (hitTitle || hitDesc) matchedSkills.push(skill);
    if (hitTitle) userSkillTitleHits += 1;
    if (hitDesc && !hitTitle) userSkillDescHits += 1;
  }

  let score = promptMatch.score;
  score += Math.min(userSkillTitleHits * 10, 30);
  score += Math.min(userSkillDescHits * 5, 15);

  const aiCat = normalizeToken(ai.category);
  const jobCat = normalizeToken(profile.category);
  const categoryMatch = Boolean(aiCat && jobCat && aiCat === jobCat);
  if (categoryMatch) score += 10;

  const aiLevel = normalizeToken(ai.level);
  const jobLevel = normalizeToken(profile.level);
  if (aiLevel && jobLevel && aiLevel === jobLevel) score += 5;

  const aiWt = normalizeToken(ai.workType);
  const jobWt = normalizeToken(profile.workType);
  if (aiWt && jobWt && aiWt === jobWt) score += 5;

  if (userAskedEducationFocus(ai.skills, ai.category) && educationTermsInBlob(jobBlobLower(job))) {
    score += 12;
  }

  const percentage = Math.min(100, Math.round((score / MAX_SCORE_REFERENCE) * 100));

  return {
    score,
    percentage,
    matchedSkills: [...new Set(matchedSkills)].slice(0, 20),
    breakdown: {
      titleSkillHits: promptMatch.titleHits + userSkillTitleHits,
      descriptionSkillHits: promptMatch.skillHits + userSkillDescHits,
      categoryMatch,
      levelMatch: Boolean(aiLevel && jobLevel && aiLevel === jobLevel),
      workTypeMatch: Boolean(aiWt && jobWt && aiWt === jobWt),
    },
  };
}

function confidenceFromPercentage(p: number): ScoredJob["confidenceLabel"] {
  if (p >= 72) return "Өндөр";
  if (p >= 42) return "Дунд";
  return "Бага";
}

export function matchJobsToAnalysis(
  ai: AiPromptAnalysis,
  jobs: MatchableJob[],
  rawPrompt = "",
): ScoredJob[] {
  const intentPhrases = buildSearchIntentPhrases(ai, rawPrompt);
  const scored = jobs.map((job) => ({
    job,
    match: scoreJob(ai, job, intentPhrases),
    confidenceLabel: confidenceFromPercentage(0) as ScoredJob["confidenceLabel"],
  }));
  for (const row of scored) {
    row.confidenceLabel = confidenceFromPercentage(row.match.percentage);
  }

  scored.sort((a, b) => {
    if (b.match.score !== a.match.score) return b.match.score - a.match.score;
    if (b.match.percentage !== a.match.percentage) return b.match.percentage - a.match.percentage;
    return String(a.job.id).localeCompare(String(b.job.id));
  });

  return scored;
}

/**
 * 1) Ажлын нэрээр (prompt) 2) Хэрэглэгчийн skill-ээр зарын гарчиг/тайлбарт тааруулна.
 */
export function filterStrongJobMatches(
  ai: AiPromptAnalysis,
  scored: ScoredJob[],
  rawPrompt: string,
): ScoredJob[] {
  const matched = scored.filter((row) => {
    if (techJobMisalignedWithEducation(ai, row.job)) return false;
    return jobMatchesUserIntent(row.job, ai, rawPrompt);
  });

  if (matched.length > 0) return matched.slice(0, 36);

  return scored
    .filter((row) => !techJobMisalignedWithEducation(ai, row.job) && row.match.percentage >= 18)
    .slice(0, 24);
}
