import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobOffersTable } from "@/lib/job-offers-db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { notify } from "@/lib/notify";

type PostBody = {
  freelancerUserId?: number;
  title?: string;
  message?: string;
  details?: {
    projectType?: string;
    budget?: string;
    duration?: string;
    startDate?: string;
    location?: string;
    requirements?: string;
  };
};

function parseDetails(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    const db = getDb();
    await ensureJobOffersTable();

    if (user.role === "freelancer") {
      const [rows] = (await db.execute(
        `SELECT o.id, o.title, o.message, o.offer_details_json, o.status, o.created_at, o.responded_at,
                u.full_name AS company_name, o.company_user_id
         FROM job_offers o
         INNER JOIN users u ON u.id = o.company_user_id
         WHERE o.freelancer_user_id = ?
         ORDER BY o.created_at DESC
         LIMIT 50`,
        [user.id],
      )) as [
        {
          id: number;
          title: string;
          message: string;
          offer_details_json: string | null;
          status: string;
          created_at: Date;
          responded_at: Date | null;
          company_name: string;
          company_user_id: number;
        }[],
        unknown,
      ];
      return NextResponse.json({
        ok: true,
        offers: rows.map((r) => ({
          details: parseDetails(r.offer_details_json),
          id: r.id,
          title: r.title,
          message: r.message,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
          respondedAt: r.responded_at ? new Date(r.responded_at).toISOString() : null,
          companyName: r.company_name,
          companyUserId: r.company_user_id,
        })),
      });
    }

    if (user.role === "company") {
      const [rows] = (await db.execute(
        `SELECT o.id, o.title, o.message, o.offer_details_json, o.status, o.created_at, o.responded_at,
                u.full_name AS freelancer_name, o.freelancer_user_id
         FROM job_offers o
         INNER JOIN users u ON u.id = o.freelancer_user_id
         WHERE o.company_user_id = ?
         ORDER BY o.created_at DESC
         LIMIT 50`,
        [user.id],
      )) as [
        {
          id: number;
          title: string;
          message: string;
          offer_details_json: string | null;
          status: string;
          created_at: Date;
          responded_at: Date | null;
          freelancer_name: string;
          freelancer_user_id: number;
        }[],
        unknown,
      ];
      return NextResponse.json({
        ok: true,
        offers: rows.map((r) => ({
          details: parseDetails(r.offer_details_json),
          id: r.id,
          title: r.title,
          message: r.message,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
          respondedAt: r.responded_at ? new Date(r.responded_at).toISOString() : null,
          freelancerName: r.freelancer_name,
          freelancerUserId: r.freelancer_user_id,
        })),
      });
    }

    return NextResponse.json({ ok: true, offers: [] as unknown[] });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "company") {
    return NextResponse.json({ error: "Зөвхөн company эрхтэй." }, { status: 403 });
  }

  const body = (await request.json()) as PostBody;
  const fid = body.freelancerUserId;
  const title = body.title?.trim();
  const message = body.message?.trim();
  const details = {
    projectType: body.details?.projectType?.trim() || "",
    budget: body.details?.budget?.trim() || "",
    duration: body.details?.duration?.trim() || "",
    startDate: body.details?.startDate?.trim() || "",
    location: body.details?.location?.trim() || "",
    requirements: body.details?.requirements?.trim() || "",
  };

  if (!fid || !title || !message) {
    return NextResponse.json(
      { error: "freelancerUserId, title, message шаардлагатай." },
      { status: 400 },
    );
  }

  const db = getDb();
  await ensureJobOffersTable();
  const [target] = (await db.execute(`SELECT id, role FROM users WHERE id = ? LIMIT 1`, [fid])) as [
    { id: number; role: string }[],
    unknown,
  ];
  if (target.length === 0 || target[0].role !== "freelancer") {
    return NextResponse.json({ error: "Freelancer олдсонгүй." }, { status: 404 });
  }

  try {
    const [hdr] = (await db.execute(
      `INSERT INTO job_offers (company_user_id, freelancer_user_id, title, message, offer_details_json)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, fid, title, message, JSON.stringify(details)],
    )) as [ResultSetHeader, unknown];

    try {
      await notify({
        userId: fid,
        type: "job_offer",
        title: "Шинэ ажлын санал",
        body: `${user.fullName}: ${title}`,
        payload: { offerId: hdr.insertId, companyUserId: user.id },
      });
    } catch {
      /* */
    }

    return NextResponse.json({ ok: true, id: hdr.insertId });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
