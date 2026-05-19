import { listJobs } from "@/lib/jobs-store";
import type { MatchableJob } from "./types";

/**
 * AI хайлтын ажлын зар — `/jobs` жагсаалттай ижил `listJobs()` (MySQL job_posts).
 * Prisma DATABASE_URL өөр schema руу зааж prisma:error гардаг тул энд ашиглахгүй.
 */
export async function fetchJobsForAiMatch(): Promise<MatchableJob[]> {
  const jobs = await listJobs();
  return jobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    companyName: j.companyName,
    location: j.location,
    employmentType: j.employmentType,
    salary: j.salary,
    createdAt: j.createdAt,
  }));
}
