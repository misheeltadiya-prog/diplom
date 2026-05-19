import type { MatchableJob } from "./types";

const TECH_KEYWORDS = [
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "typescript",
  "javascript",
  "node",
  "nodejs",
  "express",
  "nestjs",
  "python",
  "django",
  "fastapi",
  "java",
  "spring",
  "kotlin",
  "swift",
  "flutter",
  "dart",
  "go",
  "golang",
  "rust",
  "php",
  "laravel",
  "ruby",
  "rails",
  "c#",
  "dotnet",
  ".net",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "gcp",
  "kubernetes",
  "docker",
  "terraform",
  "figma",
  "photoshop",
  "illustrator",
  "tailwind",
  "css",
  "html",
  "sass",
  "webpack",
  "vite",
  "graphql",
  "rest",
  "api",
  "linux",
  "bash",
  "nginx",
  "kafka",
  "elasticsearch",
  "snowflake",
  "tableau",
  "power bi",
  "excel",
  "machine learning",
  "deep learning",
  "pytorch",
  "tensorflow",
  "nlp",
  "blockchain",
  "solidity",
  "ethereum",
];

function haystack(job: MatchableJob): string {
  return `${job.title}\n${job.description}\n${job.employmentType}\n${job.location}`.toLowerCase();
}

function inferCategory(blob: string): string {
  if (/багш|багшийн|боловсрол|сургууль|teacher|teaching|education|tutor|curriculum|academic|хичээл|заах|сургалт|сурагч|багшлах/.test(blob))
    return "education";
  if (/mobile|flutter|swift|kotlin|ios|android/.test(blob)) return "mobile";
  if (/figma|photoshop|illustrator|ui ux|ui\/ux|design|brand|graphic/.test(blob)) return "design";
  if (/data|analytics|machine learning|ml\b|deep learning|snowflake|tableau|bi\b|etl/.test(blob)) return "data";
  if (/devops|kubernetes|docker|terraform|jenkins|ci\/cd|sre\b/.test(blob)) return "devops";
  if (/qa|test automation|selenium|cypress|jest/.test(blob)) return "qa";
  if (/project manager|pm\b|product owner|scrum|management/.test(blob)) return "management";
  if (/react|vue|angular|svelte|frontend|front-end|css|html|tailwind|next\.js|nextjs/.test(blob)) return "frontend";
  if (/node|backend|back-end|java|spring|django|fastapi|api|microservice|database|sql|postgres|mysql/.test(blob))
    return "backend";
  return "other";
}

function inferLevel(blob: string): string {
  if (/senior|sr\.|lead|principal|architect|staff/.test(blob)) return "senior";
  if (/junior|jr\.|intern|internship|шинэ|гэрчилгээ|entry/.test(blob)) return "junior";
  if (/mid|middle|medium/.test(blob)) return "mid";
  return "";
}

function inferWorkType(job: MatchableJob): string {
  const blob = haystack(job);
  if (/remote|уданаас|алсаас|wfh/.test(blob)) return "remote";
  if (/hybrid|холимог/.test(blob)) return "hybrid";
  if (/freelance|гэрээт|contract|цагийн/.test(blob)) return "freelance";
  if (/хагас|part[\s-]?time|half/.test(blob)) return "parttime";
  if (/бүтэн|full[\s-]?time|fulltime/.test(blob)) return "fulltime";
  return "";
}

function extractSkills(blob: string): string[] {
  const found = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    if (blob.includes(kw)) {
      found.add(
        kw
          .split(" ")
          .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
          .join(" "),
      );
    }
  }
  return [...found].slice(0, 24);
}

export type DerivedJobProfile = {
  skills: string[];
  category: string;
  level: string;
  workType: string;
};

export function deriveJobProfile(job: MatchableJob): DerivedJobProfile {
  const blob = haystack(job);
  return {
    skills: extractSkills(blob),
    category: inferCategory(blob),
    level: inferLevel(blob),
    workType: inferWorkType(job),
  };
}

export function normalizeToken(s: string): string {
  return s.trim().toLowerCase();
}
