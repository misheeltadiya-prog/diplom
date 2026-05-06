import { NextResponse } from "next/server";
import { getDirectoryCompanyCount } from "@/lib/company-directory";
import { getJobPosts } from "@/lib/portal-data";
import { countCvProfiles } from "@/lib/profile-cv";

export async function GET() {
  const [jobs, cvCount, companyCount] = await Promise.all([
    getJobPosts(),
    countCvProfiles().catch(() => 0),
    getDirectoryCompanyCount().catch(() => 0),
  ]);

  return NextResponse.json({
    openJobs: jobs.length,
    companies: companyCount,
    cvs: cvCount,
  });
}
