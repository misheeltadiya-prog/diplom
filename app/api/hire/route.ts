import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureJobOffersTable } from "@/lib/job-offers-db";
import { ensurePlatformLeadsTable } from "@/lib/leads-db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { notify } from "@/lib/notify";
import { userHasActivePaidPlan } from "@/lib/subscription-access";

type Body = {
  freelancerUserId?: number;
  jobId?: string;
  message?: string;
  title?: string;
};

/**
 * Hire урсгал: company → job offer; client (subscription) → platform lead + notification.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON буруу." }, { status: 400 });
  }

  const freelancerUserId = body.freelancerUserId;
  if (!freelancerUserId) {
    return NextResponse.json({ error: "freelancerUserId шаардлагатай." }, { status: 400 });
  }

  const db = getDb();
  const [target] = (await db.execute(`SELECT id, role, full_name FROM users WHERE id = ? LIMIT 1`, [
    freelancerUserId,
  ])) as [{ id: number; role: string; full_name: string }[], unknown];

  if (target.length === 0 || target[0].role !== "freelancer") {
    return NextResponse.json({ error: "Freelancer олдсонгүй." }, { status: 404 });
  }

  const note = (body.message ?? "").trim();
  const title = (body.title ?? "").trim() || `Hire request — ${target[0].full_name}`;

  if (user.role === "company") {
    await ensureJobOffersTable();
    try {
      const [hdr] = (await db.execute(
        `INSERT INTO job_offers (company_user_id, freelancer_user_id, title, message, offer_details_json)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          freelancerUserId,
          title,
          note || "Компани hire хүсэлт илгээлээ.",
          JSON.stringify({
            projectType: "hire",
            budget: "",
            duration: "",
            startDate: "",
            location: "",
            requirements: body.jobId ? `jobId:${body.jobId}` : "",
          }),
        ],
      )) as [ResultSetHeader, unknown];

      try {
        await notify({
          userId: freelancerUserId,
          type: "job_offer",
          title: "Hire хүсэлт",
          body: `${user.fullName}: ${title}`,
          payload: { offerId: hdr.insertId, companyUserId: user.id },
        });
      } catch {
        /* */
      }

      return NextResponse.json({
        ok: true,
        kind: "job_offer",
        offerId: hdr.insertId,
        message: "Ажлын санал амжилттай илгээгдлээ. Freelancer /profile дээр харагдана.",
      });
    } catch (error) {
      return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
    }
  }

  if (user.role !== "client" && user.role !== "admin") {
    return NextResponse.json({ error: "Зөвхөн client эсвэл company hire хийх боломжтой." }, { status: 403 });
  }

  if (user.role === "client" && !(await userHasActivePaidPlan(user.id))) {
    return NextResponse.json(
      {
        error: "Hire — STANDARD эсвэл PREMIUM subscription шаардлагатай. /profile/upgrade",
        needSubscription: true,
      },
      { status: 403 },
    );
  }

  try {
    await ensurePlatformLeadsTable();
    const [hdr] = (await db.execute(
      `INSERT INTO platform_leads (kind, full_name, phone, email, job_type, message, budget, duration)
       VALUES ('hire', ?, ?, ?, ?, ?, '', '')`,
      [
        user.fullName,
        user.phone ?? "",
        user.email,
        body.jobId ? `job:${body.jobId}` : "direct_hire",
        note || `Hire freelancer #${freelancerUserId}`,
      ],
    )) as [ResultSetHeader, unknown];

    try {
      await notify({
        userId: freelancerUserId,
        type: "job_offer",
        title: "Hire хүсэлт",
        body: `${user.fullName} тантай ажиллах хүсэлт илгээлээ.`,
        payload: { leadId: hdr.insertId, hirerId: user.id },
      });
    } catch {
      /* */
    }

    return NextResponse.json({
      ok: true,
      kind: "hire_lead",
      leadId: hdr.insertId,
      message: "Hire хүсэлт бүртгэгдлээ. Бид тантай холбогдоно.",
    });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
