import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findCompanyUserIdsByCompanyName } from "@/lib/company-job-ownership";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOB_POST_ID_EQ_PARAM } from "@/lib/job-id-compare";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { notify } from "@/lib/notify";

type ApplyPayload = {
  jobId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  coverNote?: string;
  cvFilePath?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

type JobRow = {
  company_name: string;
  created_by: number;
  creator_role: string | null;
  title: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: jobId } = await context.params;

  try {
    const body = (await request.json()) as ApplyPayload;

    if (!body.fullName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: "ÐÑÑ€, Ð¸-Ð¼ÑÐ¹Ð», ÑƒÑ‚Ð°Ñ Ð·Ð°Ð°Ð²Ð°Ð» ÑˆÐ°Ð°Ñ€Ð´Ð»Ð°Ð³Ð°Ñ‚Ð°Ð¹." },
        { status: 400 },
      );
    }
    const applicantName = body.fullName.trim();

    const db = getDb();
    await ensureJobApplicationsTable();
    const currentUser = await getCurrentUser();
    const emailLower = body.email.trim().toLowerCase();
    const cvPath = (body.cvFilePath ?? "").trim().slice(0, 500);

    let dup: { id: number }[] = [];
    if (currentUser) {
      try {
        const [rows] = (await db.execute(
          `SELECT id FROM job_applications
           WHERE job_id = ? AND (email = ? OR applicant_user_id = ?) LIMIT 1`,
          [jobId, emailLower, currentUser.id],
        )) as [{ id: number }[], unknown];
        dup = rows;
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === "ER_BAD_FIELD_ERROR") {
          const [rows] = (await db.execute(
            `SELECT id FROM job_applications WHERE job_id = ? AND email = ? LIMIT 1`,
            [jobId, emailLower],
          )) as [{ id: number }[], unknown];
          dup = rows;
        } else {
          throw e;
        }
      }
    } else {
      const [rows] = (await db.execute(
        `SELECT id FROM job_applications WHERE job_id = ? AND email = ? LIMIT 1`,
        [jobId, emailLower],
      )) as [{ id: number }[], unknown];
      dup = rows;
    }

    if (dup.length > 0) {
      return NextResponse.json(
        { error: "Ð¢Ð° ÑÐ½Ñ Ð°Ð¶Ð¸Ð»Ð´ Ð°Ð»ÑŒ Ñ…ÑÐ´Ð¸Ð¹Ð½ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ð¸Ð»Ð³ÑÑÑÑÐ½ Ð±Ð°Ð¹Ð½Ð°." },
        { status: 409 },
      );
    }

    try {
      await db.execute(
        `INSERT INTO job_applications
           (job_id, applicant_user_id, full_name, email, phone, cover_note, cv_file_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          currentUser?.id ?? null,
          applicantName,
          emailLower,
          body.phone.trim(),
          (body.coverNote ?? "").trim(),
          cvPath,
        ],
      );
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === "ER_BAD_FIELD_ERROR") {
        await db.execute(
          `INSERT INTO job_applications
             (job_id, full_name, email, phone, cover_note)
           VALUES (?, ?, ?, ?, ?)`,
          [jobId, applicantName, emailLower, body.phone.trim(), (body.coverNote ?? "").trim()],
        );
      } else {
        throw e;
      }
    }

    try {
      const [jobs] = (await db.execute(
        `SELECT j.created_by, j.title, j.company_name, u.role AS creator_role
         FROM job_posts j
         LEFT JOIN users u ON u.id = j.created_by
         WHERE ${SQL_JOB_POST_ID_EQ_PARAM}
         LIMIT 1`,
        [jobId],
      )) as [JobRow[], unknown];

      if (jobs.length > 0) {
        const job = jobs[0];
        const recipientIds = new Set<number>();

        if (job.creator_role === "company") {
          recipientIds.add(job.created_by);
        } else {
          const matchedCompanyIds = await findCompanyUserIdsByCompanyName(job.company_name, { db });
          for (const companyUserId of matchedCompanyIds) {
            recipientIds.add(companyUserId);
          }
          if (recipientIds.size === 0 && Number.isFinite(job.created_by)) {
            recipientIds.add(job.created_by);
          }
        }

        await Promise.allSettled(
          [...recipientIds].map((userId) =>
            notify({
              userId,
              type: "new_application",
              title: "Ð¨Ð¸Ð½Ñ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ð¸Ñ€Ð»ÑÑ",
              body: `${applicantName} Ñ‚Ð°Ð½Ñ‹ "${job.title}" Ð°Ð¶Ð¸Ð»Ð´ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ð³Ð°Ñ€Ð³Ð°Ð»Ð°Ð°.`,
              payload: { jobId, applicantName },
            }),
          ),
        );
      }
    } catch {
      /* ignore */
    }

    if (currentUser) {
      try {
        await notify({
          userId: currentUser.id,
          type: "new_application",
          title: "Ó¨Ñ€Ð³Ó©Ð´Ó©Ð» Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ñ‚Ð°Ð¹ Ð¸Ð»Ð³ÑÑÐ³Ð´Ð»ÑÑ",
          body: `Ð¢Ð°Ð½Ñ‹ Ó©Ñ€Ð³Ó©Ð´Ó©Ð» Ñ…Ò¯Ð»ÑÑÐ½ Ð°Ð²Ð»Ð°Ð°. Ð¥Ð°Ñ€Ð¸ÑƒÐ³ Ñ…Ò¯Ð»ÑÑÐ½Ñ Ò¯Ò¯.`,
          payload: { jobId },
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = mysqlErrorToUserMessage(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
