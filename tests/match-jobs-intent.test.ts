import { describe, expect, it } from "vitest";
import { filterStrongJobMatches, jobMatchesUserIntent, matchJobsToAnalysis } from "@/lib/ai/match-jobs";
import { mergePromptKeywordsIntoAnalysis } from "@/lib/ai/prompt-tokens";
import type { AiPromptAnalysis, MatchableJob } from "@/lib/ai/types";

const teacherJob: MatchableJob = {
  id: "t1",
  title: "Багшийн туслах",
  description: "Сургуулийн багшийн туслах.",
  companyName: "School",
  location: "UB",
  employmentType: "fulltime",
  salary: "2M",
};

const reactJob: MatchableJob = {
  id: "r1",
  title: "React Developer",
  description: "Need React, TypeScript, Next.js",
  companyName: "Tech",
  location: "Remote",
  employmentType: "fulltime",
  salary: "5M",
};

describe("match-jobs intent", () => {
  it("matches by job title in prompt", () => {
    const ai: AiPromptAnalysis = { skills: ["багшийн туслах"], category: "education", level: "", workType: "" };
    const prompt = "багшийн туслах ажил хайж байна";
    expect(jobMatchesUserIntent(teacherJob, mergePromptKeywordsIntoAnalysis(ai, prompt), prompt)).toBe(true);
    expect(jobMatchesUserIntent(reactJob, mergePromptKeywordsIntoAnalysis(ai, prompt), prompt)).toBe(false);
  });

  it("matches by user own skills in prompt", () => {
    const ai: AiPromptAnalysis = { skills: ["React", "TypeScript"], category: "frontend", level: "", workType: "remote" };
    const prompt = "би react typescript мэддэг remote ажил хайна";
    const merged = mergePromptKeywordsIntoAnalysis(ai, prompt);
    const relevant = filterStrongJobMatches(merged, matchJobsToAnalysis(merged, [teacherJob, reactJob], prompt), prompt);
    expect(relevant.some((r) => r.job.id === "r1")).toBe(true);
    expect(relevant.some((r) => r.job.id === "t1")).toBe(false);
  });
});
