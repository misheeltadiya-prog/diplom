import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

/** Төлбөрийн систем холбогдоогүй — төлөвлөгөө сонгох placeholder */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    const db = getDb();
    const [rows] = (await db.execute(
      `SELECT plan_key, status, expires_at FROM user_subscriptions WHERE user_id = ? LIMIT 1`,
      [user.id],
    )) as [{ plan_key: string; status: string; expires_at: Date | null }[], unknown];

    const row = rows[0];
    return NextResponse.json({
      ok: true,
      plan: row?.plan_key ?? "free",
      status: row?.status ?? "active",
      expiresAt: row?.expires_at ? new Date(row.expires_at).toISOString() : null,
    });
  } catch {
    return NextResponse.json({ ok: true, plan: "free", status: "active", expiresAt: null });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  const body = (await request.json()) as { planKey?: string };
  const planKey = body.planKey === "pro" || body.planKey === "business" ? body.planKey : "free";

  try {
    const db = getDb();
    await db.execute(
      `INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at)
       VALUES (?, ?, 'active', NULL)
       ON DUPLICATE KEY UPDATE plan_key = VALUES(plan_key), status = 'active', updated_at = NOW()`,
      [user.id, planKey],
    );
  } catch {
    return NextResponse.json({ error: "Хадгалахад алдаа." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: planKey });
}
