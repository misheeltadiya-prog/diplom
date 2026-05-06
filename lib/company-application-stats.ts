import type { SessionUser } from "@/lib/auth";
import { buildCompanyOwnedJobsClause, getCompanyIdentityNames } from "@/lib/company-job-ownership";
import { getDb } from "@/lib/db";
import { ensureJobApplicationsTable } from "@/lib/job-applications-db";
import { SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID } from "@/lib/job-id-compare";

export type CompanyApplicationDashboardStats = {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
};

/**
 * Компанийн бүх ажлын зар дээр ирсэн өргөдлүүдийн тоо (job_posts.created_by = company user).
 */
export async function getCompanyApplicationDashboardStats(
  user: SessionUser,
): Promise<CompanyApplicationDashboardStats> {
  const empty: CompanyApplicationDashboardStats = { total: 0, accepted: 0, rejected: 0, pending: 0 };
  if (user.role !== "company") {
    return empty;
  }

  try {
    const db = getDb();
    await ensureJobApplicationsTable();
    const identityNames = await getCompanyIdentityNames(user);
    const ownership = buildCompanyOwnedJobsClause(user.id, identityNames, "j");
    const [rows] = (await db.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
         SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
         SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending
       FROM job_applications a
       INNER JOIN job_posts j ON ${SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID}
       WHERE ${ownership.sql}`,
      ownership.params,
    )) as [
      { total: number; accepted: string | number | null; rejected: string | number | null; pending: string | number | null }[],
      unknown,
    ];

    const row = rows[0];
    if (!row) {
      return empty;
    }

    return {
      total: Number(row.total ?? 0),
      accepted: Number(row.accepted ?? 0),
      rejected: Number(row.rejected ?? 0),
      pending: Number(row.pending ?? 0),
    };
  } catch {
    return empty;
  }
}

/** Компанийн бүх заруудад хүлээгдэж буй (pending) өргөдлийн тоо — тэмдэгт дээр ашиглана. */
export async function getCompanyPendingApplicationsCount(user: SessionUser): Promise<number> {
  if (user.role !== "company") {
    return 0;
  }

  try {
    const db = getDb();
    await ensureJobApplicationsTable();
    const identityNames = await getCompanyIdentityNames(user);
    const ownership = buildCompanyOwnedJobsClause(user.id, identityNames, "j");
    const [rows] = (await db.execute(
      `SELECT COUNT(*) AS c
       FROM job_applications a
       INNER JOIN job_posts j ON ${SQL_JOIN_JOB_POST_TO_APPLICATION_JOB_ID}
       WHERE ${ownership.sql} AND a.status = 'pending'`,
      ownership.params,
    )) as [{ c: number }[], unknown];

    return Number(rows[0]?.c ?? 0);
  } catch {
    return 0;
  }
}
