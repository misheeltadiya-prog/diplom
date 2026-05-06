import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { getCompanyIdentityNames, isCompanyNameMatch } from "@/lib/company-job-ownership";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOB_POST_ID_EQ_PARAM } from "@/lib/job-id-compare";
import { notify } from "@/lib/notify";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AppRow = {
  id: number;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  cover_note: string;
  status: string;
  created_at: Date;
};

async function assertJobOwner(
  db: ReturnType<typeof getDb>,
  jobId: string,
  currentUser: SessionUser,
) {
  const [rows] = (await db.execute(
    `SELECT created_by, company_name FROM job_posts WHERE ${SQL_JOB_POST_ID_EQ_PARAM} LIMIT 1`,
    [jobId],
  )) as [{ company_name: string; created_by: number }[], unknown];

  if (rows.length === 0) {
    return { ok: false as const, status: 404 as const, error: "ÐÐ¶Ð¸Ð» Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹." };
  }

  if (rows[0].created_by !== currentUser.id) {
    const identityNames = await getCompanyIdentityNames(currentUser);
    if (!isCompanyNameMatch(rows[0].company_name, identityNames)) {
      return { ok: false as const, status: 403 as const, error: "Ð—Ó©Ð²Ñ…Ó©Ð½ Ð°Ð¶Ð»Ñ‹Ð½ ÑÐ·ÑÐ½ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ñ…Ð°Ñ€Ð°Ñ… Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ñ‚Ð¾Ð¹." };
    }
  }

  return { ok: true as const };
}

export async function GET(_req: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "ÐÑÐ²Ñ‚Ñ€ÑÑ… ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹." }, { status: 401 });
  }

  const { id: jobId } = await context.params;
  const db = getDb();
  await ensureJobApplicationsTable();

  const gate = await assertJobOwner(db, jobId, currentUser);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const [rows] = (await db.execute(
    `SELECT id, job_id, full_name, email, phone, cover_note, status, created_at
     FROM job_applications
     WHERE job_id = ?
     ORDER BY created_at DESC`,
    [jobId],
  )) as [AppRow[], unknown];

  const applications = rows.map((r) => ({
    id: r.id,
    jobId: r.job_id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    coverNote: r.cover_note,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  return NextResponse.json({ ok: true, applications });
}

export async function PATCH(req: Request, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "ÐÑÐ²Ñ‚Ñ€ÑÑ… ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹." }, { status: 401 });
  }

  const { id: jobId } = await context.params;
  const body = (await req.json()) as { applicationId?: number; status?: string };

  if (!body.applicationId || !["pending", "accepted", "rejected"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "applicationId Ð±Ð¾Ð»Ð¾Ð½ status ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹." }, { status: 400 });
  }

  const newStatus = body.status as "pending" | "accepted" | "rejected";
  const db = getDb();
  await ensureJobApplicationsTable();
  const gate = await assertJobOwner(db, jobId, currentUser);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const [apps] = (await db.execute(
    `SELECT id, email, applicant_user_id, full_name FROM job_applications WHERE id = ? AND job_id = ? LIMIT 1`,
    [body.applicationId, jobId],
  )) as [{ id: number; email: string; applicant_user_id: number | null; full_name: string }[], unknown];

  if (apps.length === 0) {
    return NextResponse.json({ error: "Ó¨Ñ€Ð³Ó©Ð´Ó©Ð» Ð¾Ð»Ð´ÑÐ¾Ð½Ð³Ò¯Ð¹." }, { status: 404 });
  }

  await db.execute(
    `UPDATE job_applications
     SET status = ?, reviewed_at = NOW()
     WHERE id = ? AND job_id = ?`,
    [newStatus, body.applicationId, jobId],
  );

  const app = apps[0];
  let notifyUserId = app.applicant_user_id;

  if (notifyUserId == null) {
    const [users] = (await db.execute(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [app.email.toLowerCase()],
    )) as [{ id: number }[], unknown];
    notifyUserId = users[0]?.id ?? null;
  }

  if (notifyUserId != null) {
    const title =
      newStatus === "accepted"
        ? "Ó¨Ñ€Ð³Ó©Ð´Ó©Ð» Ñ…Ò¯Ð»ÑÑÐ½ Ð°Ð²Ð»Ð°Ð°"
        : newStatus === "rejected"
          ? "Ó¨Ñ€Ð³Ó©Ð´Ó©Ð» Ñ‚Ð°Ñ‚Ð³Ð°Ð»Ð·Ð»Ð°Ð°"
          : "Ó¨Ñ€Ð³Ó©Ð´Ð»Ð¸Ð¹Ð½ Ñ‚Ó©Ð»Ó©Ð² ÑˆÐ¸Ð½ÑÑ‡Ð»ÑÐ³Ð´Ð»ÑÑ";

    const statusBody =
      newStatus === "accepted"
        ? "ÐÐ¶Ð»Ñ‹Ð½ Ð·Ð°Ñ€Ñ‹Ð½ ÑÐ·ÑÐ½ Ñ‚Ð°Ð½Ñ‹ Ó©Ñ€Ð³Ó©Ð´Ð»Ð¸Ð¹Ð³ Ñ…Ò¯Ð»ÑÑÐ½ Ð°Ð²Ð»Ð°Ð°."
        : newStatus === "rejected"
          ? "ÐÐ¶Ð»Ñ‹Ð½ Ð·Ð°Ñ€Ñ‹Ð½ ÑÐ·ÑÐ½ Ñ‚Ð°Ð½Ñ‹ Ó©Ñ€Ð³Ó©Ð´Ð»Ð¸Ð¹Ð³ Ñ‚Ð°Ñ‚Ð³Ð°Ð»Ð·Ð»Ð°Ð°."
          : "Ð¢Ð°Ð½Ñ‹ Ó©Ñ€Ð³Ó©Ð´Ð»Ð¸Ð¹Ð½ Ñ‚Ó©Ð»Ó©Ð² ÑˆÐ¸Ð½ÑÑ‡Ð»ÑÐ³Ð´Ð»ÑÑ.";

    try {
      await notify({
        userId: notifyUserId,
        type: "application_status",
        title,
        body: statusBody,
        payload: { jobId, applicationId: body.applicationId, status: newStatus },
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true });
}
