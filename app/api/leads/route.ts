import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensurePlatformLeadsTable } from "@/lib/leads-db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";

type LeadBody = {
  kind?: "hire" | "join";
  fullName?: string;
  phone?: string;
  email?: string;
  jobType?: string;
  message?: string;
  budget?: string;
  duration?: string;
};

export async function POST(request: Request) {
  let body: LeadBody;
  try {
    body = (await request.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON буруу байна." }, { status: 400 });
  }

  const kind = body.kind === "join" ? "join" : body.kind === "hire" ? "hire" : null;
  const fullName = (body.fullName ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const message = (body.message ?? "").trim();

  if (!kind || !fullName || !phone || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "kind, fullName, phone, email, message заавал." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "И-мэйл буруу байна." }, { status: 400 });
  }

  try {
    await ensurePlatformLeadsTable();
    const db = getDb();
    const [hdr] = (await db.execute(
      `INSERT INTO platform_leads (kind, full_name, phone, email, job_type, message, budget, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kind,
        fullName,
        phone,
        email,
        (body.jobType ?? "").trim(),
        message,
        (body.budget ?? "").trim(),
        (body.duration ?? "").trim(),
      ],
    )) as [ResultSetHeader, unknown];

    return NextResponse.json({ ok: true, id: hdr.insertId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}

/** Admin: сүүлийн lead-үүд */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Зөвхөн admin." }, { status: 403 });
  }

  try {
    await ensurePlatformLeadsTable();
    const db = getDb();
    const [rows] = (await db.execute(
      `SELECT id, kind, full_name, phone, email, job_type, message, budget, duration, status, created_at
       FROM platform_leads
       ORDER BY created_at DESC
       LIMIT 100`,
    )) as [
      {
        id: number;
        kind: string;
        full_name: string;
        phone: string;
        email: string;
        job_type: string;
        message: string;
        budget: string;
        duration: string;
        status: string;
        created_at: Date;
      }[],
      unknown,
    ];

    return NextResponse.json({
      ok: true,
      leads: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        fullName: r.full_name,
        phone: r.phone,
        email: r.email,
        jobType: r.job_type,
        message: r.message,
        budget: r.budget,
        duration: r.duration,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: mysqlErrorToUserMessage(error) }, { status: 500 });
  }
}
