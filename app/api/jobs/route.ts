import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeJobTabCounts } from "@/lib/job-tab-counts";
import { getJobPosts } from "@/lib/portal-data";
import { createJob, type JobPayload } from "@/lib/jobs-store";
import { canPostJob } from "@/services/subscriptionService";

export const dynamic = "force-dynamic";

type IncomingJobPayload = Partial<JobPayload>;

export async function GET() {
  const jobs = await getJobPosts();
  const tabCounts = computeJobTabCounts(jobs);

  return NextResponse.json(
    { jobs, tabCounts },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
    }
    if (user.role !== "company" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Ажлын зар оруулахын тулд company эрхээр нэвтэрнэ үү (/register?role=company)." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as IncomingJobPayload;

    if (
      !body.title ||
      !body.companyName ||
      !body.location ||
      !body.employmentType ||
      !body.salary ||
      !body.description
    ) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү." }, { status: 400 });
    }

    if (user.role === "company") {
      const postCheck = await canPostJob(user.id);
      if (!postCheck.ok) {
        return NextResponse.json({ error: postCheck.reason, needSubscription: true }, { status: 403 });
      }
    }

    await createJob(
      {
        title: body.title.trim(),
        companyName: body.companyName.trim(),
        location: body.location.trim(),
        employmentType: body.employmentType.trim(),
        salary: body.salary.trim(),
        description: body.description.trim(),
      },
      { createdByUserId: user.id },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ажлын зар хадгалахад алдаа." },
      { status: 500 },
    );
  }
}
