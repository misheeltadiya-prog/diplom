import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOB_POST_ID_EQ_PARAM } from "@/lib/job-id-compare";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { notify } from "@/lib/notify";
import { canApplyToJobToday, recordJobApplicationUsage } from "@/services/subscriptionService";

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
  created_by: number;
  title: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: jobId } = await context.params;

  try {
    const body = (await request.json()) as ApplyPayload;

    if (!body.fullName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: "Нэр, и-мэйл, утас заавал шаардлагатай." },
        { status: 400 },
      );
    }
    const applicantName = body.fullName.trim();

    const db = getDb();
    await ensureJobApplicationsTable();
    const currentUser = await getCurrentUser();
    if (currentUser?.id && currentUser.role === "freelancer") {
      const applyCheck = await canApplyToJobToday(currentUser.id);
      if (!applyCheck.ok) {
        return NextResponse.json({ error: applyCheck.reason, needSubscription: true }, { status: 403 });
      }
    }
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
        { error: "Та энэ ажилд аль хэдийн өргөдөл илгээсэн байна." },
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
        `SELECT j.created_by, j.title
         FROM job_posts j
         WHERE ${SQL_JOB_POST_ID_EQ_PARAM}
         LIMIT 1`,
        [jobId],
      )) as [JobRow[], unknown];

      if (jobs.length > 0) {
        const job = jobs[0];
        const recipientIds = new Set<number>();

        if (Number.isFinite(job.created_by)) {
          recipientIds.add(job.created_by);
        }

        await Promise.allSettled(
          [...recipientIds].map((userId) =>
            notify({
              userId,
              type: "new_application",
              title: "Шинэ өргөдөл ирлээ",
              body: `${applicantName} таны "${job.title}" ажилд өргөдөл гаргалаа.`,
              payload: { jobId, applicantName },
            }),
          ),
        );
      }
    } catch {
      /* ignore */
    }

    if (currentUser?.id && currentUser.role === "freelancer") {
      try {
        await recordJobApplicationUsage(currentUser.id);
      } catch {
        /* ignore quota side-effect failure */
      }
    }

    if (currentUser) {
      try {
        await notify({
          userId: currentUser.id,
          type: "new_application",
          title: "Өргөдөл амжилттай илгээгдлээ",
          body: "Таны өргөдөл хүлээн авлаа. Хариуг хүлээнэ үү.",
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
