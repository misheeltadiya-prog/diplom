import type { AiPromptAnalysis } from "./types";
import { normalizeToken } from "./job-profile";
import { promptSearchPhrases } from "./prompt-tokens";
import { skillMatchPhrases } from "./skill-synonyms";

export type SearchIntentMatch = {
  score: number;
  percentage: number;
  matchedSkills: string[];
  titleHits: number;
  skillHits: number;
};

export function includesLoose(haystackLower: string, needle: string): boolean {
  const n = normalizeToken(needle);
  if (!n) return false;
  if (haystackLower.includes(n)) return true;
  const compact = n.replace(/[\s._-]/g, "");
  if (compact.length >= 3 && haystackLower.replace(/[\s._-]/g, "").includes(compact)) return true;
  return false;
}

export function buildSearchIntentPhrases(ai: AiPromptAnalysis, rawPrompt: string): string[] {
  const set = new Set<string>();
  const add = (phrase: string) => {
    const p = phrase.trim().toLowerCase();
    if (p.length < 2) return;
    set.add(p);
    for (const syn of skillMatchPhrases(p)) {
      if (syn.length >= 2) set.add(syn.toLowerCase());
    }
  };
  for (const p of promptSearchPhrases(rawPrompt)) add(p);
  for (const skill of ai.skills) add(skill.trim());
  if (ai.category.trim()) add(ai.category.trim());
  return [...set].slice(0, 48);
}

export function scoreIntentMatch(params: {
  title: string;
  descriptions: string[];
  skillTags: string[];
  intentPhrases: string[];
}): SearchIntentMatch {
  const titleL = params.title.toLowerCase();
  const descBlob = params.descriptions.join("\n").toLowerCase();
  const skillBlob = params.skillTags.join(" ").toLowerCase();

  let titleHits = 0;
  let skillHits = 0;
  const matchedSkills: string[] = [];

  for (const phrase of params.intentPhrases) {
    if (includesLoose(titleL, phrase)) titleHits += 1;
    if (params.skillTags.some((s) => includesLoose(s.toLowerCase(), phrase))) skillHits += 1;
    if (includesLoose(skillBlob, phrase) || includesLoose(descBlob, phrase)) skillHits += 1;
  }

  for (const raw of params.skillTags) {
    const skill = raw.trim();
    if (!skill) continue;
    for (const phrase of skillMatchPhrases(skill)) {
      if (includesLoose(titleL, phrase) || includesLoose(descBlob, phrase)) {
        matchedSkills.push(skill);
        break;
      }
    }
  }

  let score = Math.min(titleHits * 12, 36) + Math.min(skillHits * 8, 32);
  if (titleHits > 0 && skillHits > 0) score += 10;
  if (matchedSkills.length > 0) score += 6;

  return {
    score,
    percentage: Math.min(100, Math.round((score / 58) * 100)),
    matchedSkills: [...new Set(matchedSkills)].slice(0, 16),
    titleHits,
    skillHits,
  };
}

export function entityMatchesSearchIntent(match: SearchIntentMatch): boolean {
  return match.titleHits > 0 || match.skillHits > 0;
}
