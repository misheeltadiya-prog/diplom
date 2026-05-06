import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type Body = { token?: string; password?: string };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`reset:${ip}`, { windowMs: 600_000, max: 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Хэт олон оролдлого." }, { status: 429 });
  }

  const body = (await request.json()) as Body;
  const token = body.token?.trim();
  const password = body.password?.trim();

  if (!token || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Token болон хамгийн багадаа 6 тэмдэгттэй нууц үг шаардлагатай." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [rows] = (await db.execute(
    `SELECT id, user_id FROM password_resets
     WHERE token = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [token],
  )) as [{ id: number; user_id: number }[], unknown];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Холбоос хүчингүй эсвэл хугацаа дууссан." }, { status: 400 });
  }

  const hash = hashPassword(password);
  await db.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, rows[0].user_id]);
  await db.execute(`UPDATE password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ?`, [rows[0].id]);

  return NextResponse.json({ ok: true });
}
