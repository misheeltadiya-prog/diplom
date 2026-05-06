import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isDemoLoginEnabled } from "@/lib/demo-auth";

type Body = {
  userId?: number;
};

type UserRow = {
  id: number;
  role: string | null;
};

export async function POST(request: Request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Demo login is disabled." }, { status: 403 });
  }

  const body = (await request.json()) as Body;
  const userId = Number(body.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "userId буруу." }, { status: 400 });
  }

  const db = getDb();
  const [rows] = (await db.execute(
    `SELECT id, role FROM users WHERE id = ? LIMIT 1`,
    [userId],
  )) as [UserRow[], unknown];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй." }, { status: 404 });
  }

  const role = rows[0].role ?? "client";
  if (role !== "company" && role !== "freelancer" && role !== "admin") {
    return NextResponse.json({ error: "Demo login зөвхөн company/freelancer/admin." }, { status: 403 });
  }

  await createSession(userId);
  return NextResponse.json({ ok: true, role });
}

