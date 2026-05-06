import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID } from "@/lib/job-id-compare";

export const dynamic = "force-dynamic";

type Row = {
  app_id: number;
  job_id: string;
  status: string;
  applied_at: Date;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  salary: string;
  description: string;
  job_created_at: Date;
  created_by: number | null;
  created_by_name: string | null;
};

function toIso(value: Date) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/** Нэвтэрсэн хэрэглэгчийн ажлын зар дээр илгээсэн өргөдлүүд + зарын мэдээлэл */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role === "company") {
    return NextResponse.json({ error: "Энэ холбоос зөвхөн ажил горилогчид зориулагдсан." }, { status: 403 });
  }

  try {
    const db = getDb();
    await ensureJobApplicationsTable();
    const [rows] = (await db.execute(
      `SELECT a.id AS app_id, a.job_id, a.status, a.created_at AS applied_at,
              j.title, j.company_name, j.location, j.employment_type, j.salary, j.description,
              j.created_at AS job_created_at, j.created_by, u.full_name AS created_by_name
       FROM job_applications a
       INNER JOIN job_posts j ON ${SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID}
       LEFT JOIN users u ON u.id = j.created_by
       WHERE a.applicant_user_id = ? OR LOWER(TRIM(a.email)) = LOWER(TRIM(?))
       ORDER BY a.created_at DESC`,
      [user.id, user.email],
    )) as [Row[], unknown];

    const applications = rows.map((r) => ({
      id: r.app_id,
      jobId: String(r.job_id),
      status: r.status as "pending" | "accepted" | "rejected",
      createdAt: toIso(r.applied_at),
      job: {
        id: String(r.job_id),
        title: r.title,
        companyName: r.company_name,
        location: r.location,
        employmentType: r.employment_type,
        salary: r.salary,
        description: r.description,
        createdAt: toIso(r.job_created_at),
        createdByName: r.created_by_name,
        createdByUserId: r.created_by,
      },
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
