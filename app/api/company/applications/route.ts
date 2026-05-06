import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildCompanyOwnedJobsClause, getCompanyIdentityNames } from "@/lib/company-job-ownership";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID } from "@/lib/job-id-compare";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  job_id: string;
  job_title: string;
  full_name: string;
  email: string;
  phone: string;
  cover_note: string;
  cv_file_path: string;
  applicant_user_id: number | null;
  status: string;
  created_at: Date;
};

/** Компани өөрийн бүх ажлын заруудад ирсэн өргөдлүүд */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "company") {
    return NextResponse.json({ error: "Зөвхөн компани эрхтэй." }, { status: 403 });
  }

  try {
    const db = getDb();
    await ensureJobApplicationsTable();
    const identityNames = await getCompanyIdentityNames(user);
    const ownership = buildCompanyOwnedJobsClause(user.id, identityNames, "j");
    const [rows] = (await db.execute(
      `SELECT a.id, a.job_id, j.title AS job_title, a.full_name, a.email, a.phone, a.cover_note,
              a.cv_file_path, a.applicant_user_id, a.status, a.created_at
       FROM job_applications a
       INNER JOIN job_posts j ON ${SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID}
       WHERE ${ownership.sql}
       ORDER BY a.created_at DESC`,
      ownership.params,
    )) as [Row[], unknown];

    const applications = rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      jobTitle: r.job_title,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      coverNote: r.cover_note,
      cvFilePath: (r.cv_file_path ?? "").trim(),
      applicantUserId: r.applicant_user_id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    }));

    return NextResponse.json(
      { ok: true, applications },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Өргөдлүүдийг уншихад алдаа." },
      { status: 500 },
    );
  }
}
