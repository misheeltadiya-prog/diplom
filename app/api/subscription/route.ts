import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";

async function ensureTable() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      user_id BIGINT UNSIGNED NOT NULL,
      plan_key VARCHAR(40) NOT NULL DEFAULT 'free',
      status VARCHAR(40) NOT NULL DEFAULT 'active',
      expires_at DATETIME NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      CONSTRAINT user_subscriptions_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    )
  `);
}

/** Төлбөрийн систем холбогдоогүй — төлөвлөгөө сонгох placeholder */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    await ensureTable();
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
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: mysqlErrorToUserMessage(e) },
      { status: 500 },
    );
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
    await ensureTable();
    const db = getDb();
    await db.execute(
      `INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at)
       VALUES (?, ?, 'active', NULL)
       ON DUPLICATE KEY UPDATE plan_key = VALUES(plan_key), status = 'active', updated_at = NOW()`,
      [user.id, planKey],
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: mysqlErrorToUserMessage(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: planKey });
}
