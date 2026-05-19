import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "company") {
    return NextResponse.json({ error: "Зөвхөн company." }, { status: 403 });
  }

  try {
    const db = getDb();
    const [jobs] = (await db.execute(
      `SELECT COUNT(*) AS c FROM job_posts WHERE created_by = ?`,
      [user.id],
    )) as [{ c: number }[], unknown];
    const [apps] = (await db.execute(
      `SELECT COUNT(*) AS c
       FROM job_applications ja
       INNER JOIN job_posts jp ON jp.id = ja.job_id
       WHERE jp.created_by = ?`,
      [user.id],
    )) as [{ c: number }[], unknown];
    const [offers] = (await db.execute(
      `SELECT COUNT(*) AS c FROM job_offers WHERE company_user_id = ?`,
      [user.id],
    )) as [{ c: number }[], unknown];
    const [offersPending] = (await db.execute(
      `SELECT COUNT(*) AS c FROM job_offers WHERE company_user_id = ? AND status = 'pending'`,
      [user.id],
    )) as [{ c: number }[], unknown];

    const [recentApps] = (await db.execute(
      `SELECT ja.id, jp.title, ja.status, ja.created_at
       FROM job_applications ja
       INNER JOIN job_posts jp ON jp.id = ja.job_id
       WHERE jp.created_by = ?
       ORDER BY ja.created_at DESC
       LIMIT 10`,
      [user.id],
    )) as [
      { id: number; title: string; status: string; created_at: Date }[],
      unknown,
    ];

    return NextResponse.json({
      ok: true,
      stats: {
        jobPosts: jobs[0]?.c ?? 0,
        applications: apps[0]?.c ?? 0,
        offersSent: offers[0]?.c ?? 0,
        offersPending: offersPending[0]?.c ?? 0,
      },
      recentApplications: recentApps.map((r) => ({
        id: r.id,
        jobTitle: r.title,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
