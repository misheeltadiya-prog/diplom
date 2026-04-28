import { NextResponse } from "next/server";
import { deleteJob, type JobPayload, updateJob } from "@/lib/jobs-store";

type IncomingJobPayload = Partial<JobPayload>;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseJobId(rawId: string) {
  const id = rawId.trim();

  if (!id) {
    return null;
  }

  return id;
}

export async function PUT(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseJobId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

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

    const updated = await updateJob(id, {
      title: body.title.trim(),
      companyName: body.companyName.trim(),
      location: body.location.trim(),
      employmentType: body.employmentType.trim(),
      salary: body.salary.trim(),
      description: body.description.trim(),
    });

    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update job post." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseJobId(rawId);

  if (!id) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    const deleted = await deleteJob(id);

    if (!deleted) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete job post." },
      { status: 500 },
    );
  }
}
