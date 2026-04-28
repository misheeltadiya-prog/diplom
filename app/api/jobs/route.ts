import { NextResponse } from "next/server";
import { getJobPosts } from "@/lib/portal-data";
import { createJob, type JobPayload } from "@/lib/jobs-store";

type IncomingJobPayload = Partial<JobPayload>;

export async function GET() {
  const jobs = await getJobPosts();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingJobPayload;

    if (
      !body.title ||
      !body.companyName ||
      !body.location ||
      !body.employmentType ||
      !body.salary ||
      !body.description
    ) {
      return NextResponse.json({ error: "Please fill all job fields." }, { status: 400 });
    }

    await createJob({
      title: body.title.trim(),
      companyName: body.companyName.trim(),
      location: body.location.trim(),
      employmentType: body.employmentType.trim(),
      salary: body.salary.trim(),
      description: body.description.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save job post." },
      { status: 500 },
    );
  }
}
