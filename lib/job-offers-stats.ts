import type { SessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobOffersTable } from "@/lib/job-offers-db";

export type OfferDashboardStats = {
  total: number;
  accepted: number;
  rejectedOrCancelled: number;
};

/**
 * Ажлын санал (job_offers) — профайл дээрх статистик.
 * Freelancer: надад ирсэн санал; Company: би илгээсэн санал.
 */
export async function getOfferDashboardStats(user: SessionUser): Promise<OfferDashboardStats> {
  const empty: OfferDashboardStats = { total: 0, accepted: 0, rejectedOrCancelled: 0 };

  if (user.role !== "freelancer" && user.role !== "company") {
    return empty;
  }

  try {
    const db = getDb();
    await ensureJobOffersTable();
    const sql =
      user.role === "freelancer"
        ? `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
             SUM(CASE WHEN status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END) AS ended
           FROM job_offers
           WHERE freelancer_user_id = ?`
        : `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted,
             SUM(CASE WHEN status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END) AS ended
           FROM job_offers
           WHERE company_user_id = ?`;

    const [rows] = (await db.execute(sql, [user.id])) as [
      { total: number; accepted: string | number | null; ended: string | number | null }[],
      unknown,
    ];

    const row = rows[0];
    if (!row) return empty;

    return {
      total: Number(row.total ?? 0),
      accepted: Number(row.accepted ?? 0),
      rejectedOrCancelled: Number(row.ended ?? 0),
    };
  } catch {
    return empty;
  }
}
