import { NextResponse } from "next/server";
import { analyzeUserPrompt } from "@/lib/ai/gemini";
import { fetchJobsForAiMatch } from "@/lib/ai/fetch-jobs-for-ai-match";
import { fetchFreelancersForAiMatch } from "@/lib/ai/fetch-freelancers-for-ai-match";
import { resolveSearchTarget } from "@/lib/ai/detect-search-target";
import { filterStrongJobMatches, matchJobsToAnalysis } from "@/lib/ai/match-jobs";
import { filterStrongFreelancerMatches, matchFreelancersToAnalysis } from "@/lib/ai/match-freelancers";
import { mergePromptKeywordsIntoAnalysis } from "@/lib/ai/prompt-tokens";
import { deriveJobProfile } from "@/lib/ai/job-profile";
import type { AiPromptAnalysis, AiSearchTarget } from "@/lib/ai/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { prompt?: string; target?: string };

function serializeJobs(jobs: ReturnType<typeof matchJobsToAnalysis>) {
  return jobs.slice(0, 36).map((row) => ({
    job: {
      id: row.job.id,
      title: row.job.title,
      description: row.job.description,
      companyName: row.job.companyName,
      location: row.job.location,
      employmentType: row.job.employmentType,
      salary: row.job.salary,
      createdAt: row.job.createdAt ?? null,
    },
    derived: deriveJobProfile(row.job),
    match: row.match,
    confidenceLabel: row.confidenceLabel,
  }));
}

function serializeFreelancers(freelancers: ReturnType<typeof matchFreelancersToAnalysis>) {
  return freelancers.slice(0, 36).map((row) => ({
    freelancer: {
      id: row.freelancer.id,
      fullName: row.freelancer.fullName,
      roleTitle: row.freelancer.roleTitle,
      shortDescription: row.freelancer.shortDescription,
      skills: row.freelancer.skills,
      priceLabel: row.freelancer.priceLabel,
      rating: row.freelancer.rating,
      avatarUrl: row.freelancer.avatarUrl ?? null,
      linkedUserId: row.freelancer.linkedUserId ?? null,
    },
    match: row.match,
    confidenceLabel: row.confidenceLabel,
  }));
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`ai-match:${ip}`, { windowMs: 60_000, max: 20 });
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Хэт олон хүсэлт. 1 минутын дараа дахин оролдоно уу." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "JSON бие буруу байна." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Тайлбар (prompt) хоосон байна." }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ success: false, error: "Текст хэт урт байна (4,000 тэмдэгт хүртэл)." }, { status: 400 });
  }

  const searchTarget: AiSearchTarget = resolveSearchTarget(prompt, body.target);

  let aiAnalysisRaw: AiPromptAnalysis;
  try {
    aiAnalysisRaw = await analyzeUserPrompt(prompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini алдаа.";
    const missingKey = /GEMINI_API_KEY/i.test(msg);
    return NextResponse.json(
      { success: false, error: missingKey ? "GEMINI_API_KEY тохируулаагүй байна." : msg },
      { status: missingKey ? 503 : 502 },
    );
  }

  const aiAnalysis = mergePromptKeywordsIntoAnalysis(aiAnalysisRaw, prompt);
  const wantJobs = searchTarget === "jobs" || searchTarget === "both";
  const wantFreelancers = searchTarget === "freelancers" || searchTarget === "both";

  let jobPayload: ReturnType<typeof serializeJobs> = [];
  let freelancerPayload: ReturnType<typeof serializeFreelancers> = [];

  if (wantJobs) {
    try {
      const jobs = await fetchJobsForAiMatch();
      if (jobs.length > 0) {
        const ranked = matchJobsToAnalysis(aiAnalysis, jobs, prompt);
        jobPayload = serializeJobs(filterStrongJobMatches(aiAnalysis, ranked, prompt));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ажлын зар уншиж чадсангүй.";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  if (wantFreelancers) {
    try {
      const freelancers = await fetchFreelancersForAiMatch();
      if (freelancers.length > 0) {
        const ranked = matchFreelancersToAnalysis(aiAnalysis, freelancers, prompt);
        freelancerPayload = serializeFreelancers(filterStrongFreelancerMatches(aiAnalysis, ranked, prompt));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Freelancer жагсаалт уншиж чадсангүй.";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  const empty = jobPayload.length === 0 && freelancerPayload.length === 0;
  let message: string | undefined;
  if (empty) {
    message =
      searchTarget === "freelancers"
        ? "Таны хайсан ажлын нэр эсвэл ур чадвартай таарсан freelancer олдсонгүй."
        : searchTarget === "jobs"
          ? "Таны хайсан ажлын нэр эсвэл ур чадвартай таарсан зар олдсонгүй."
          : "Таны хайсан ажлын нэр / ур чадвартай таарсан зар эсвэл freelancer олдсонгүй.";
  }

  return NextResponse.json({
    success: true,
    aiAnalysis,
    searchTarget,
    jobs: jobPayload,
    freelancers: freelancerPayload,
    message,
  });
}
