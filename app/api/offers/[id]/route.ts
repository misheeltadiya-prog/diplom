import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobOffersTable } from "@/lib/job-offers-db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { notify } from "@/lib/notify";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const offerId = Number((await context.params).id);
  if (!Number.isFinite(offerId)) {
    return NextResponse.json({ error: "ID буруу." }, { status: 400 });
  }

  const body = (await req.json()) as { status?: string };
  const raw = body.status?.trim();
  if (raw !== "accepted" && raw !== "rejected" && raw !== "cancelled") {
    return NextResponse.json({ error: "status: accepted | rejected | cancelled" }, { status: 400 });
  }
  const status = raw;

  const db = getDb();
  await ensureJobOffersTable();

  try {
    const [rows] = (await db.execute(
      `SELECT id, company_user_id, freelancer_user_id, status FROM job_offers WHERE id = ? LIMIT 1`,
      [offerId],
    )) as [
      { id: number; company_user_id: number; freelancer_user_id: number; status: string }[],
      unknown,
    ];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Олдсонгүй." }, { status: 404 });
    }

    const o = rows[0];

    if (user.role === "freelancer") {
      if (o.freelancer_user_id !== user.id) {
        return NextResponse.json({ error: "Эрхгүй." }, { status: 403 });
      }
      if (status === "cancelled") {
        return NextResponse.json({ error: "Зөвхөн компани цуцална." }, { status: 400 });
      }
    } else if (user.role === "company") {
      if (o.company_user_id !== user.id) {
        return NextResponse.json({ error: "Эрхгүй." }, { status: 403 });
      }
      if (status !== "cancelled") {
        return NextResponse.json({ error: "Компани зөвхөн cancelled." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Эрхгүй." }, { status: 403 });
    }

    const updateSql =
      "UPDATE job_offers SET status = ?, responded_at = CASE WHEN ? IN ('accepted','rejected') THEN NOW() ELSE responded_at END WHERE id = ? AND status = 'pending'";
    const [hdr] = (await db.execute(updateSql, [status, status, offerId])) as [ResultSetHeader, unknown];

    if (!hdr.affectedRows) {
      return NextResponse.json({ error: "Өөрчлөх боломжгүй (аль хэдийн хариу өгсөн)." }, { status: 409 });
    }

    try {
      if (status === "accepted" || status === "rejected") {
        await notify({
          userId: o.company_user_id,
          type: "job_offer",
          title: status === "accepted" ? "Санал хүлээн авлаа" : "Санал татгалзлаа",
          body: `Freelancer таны саналыг ${status === "accepted" ? "хүлээн авлаа" : "татгалзлаа"}.`,
          payload: { offerId, status },
        });
      }
    } catch {
      /* */
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
