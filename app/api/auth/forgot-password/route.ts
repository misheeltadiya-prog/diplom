import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { publicAppUrl, sendTransactionalEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type Body = { email?: string };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`forgot:${ip}`, { windowMs: 600_000, max: 8 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Хэт олон оролдлого. Дараа дахин оролдоно уу." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as Body;
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "И-мэйл оруулна уу." }, { status: 400 });
    }

    const db = getDb();
    const [rows] = (await db.execute(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email])) as [
      { id: number }[],
      unknown,
    ];

    if (rows.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [rows[0].id, token, expires],
    );

    const resetUrl = publicAppUrl(`/reset-password?token=${encodeURIComponent(token)}`);

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, devResetUrl: resetUrl });
    }

    await sendTransactionalEmail({
      to: email,
      subject: "C-Work — нууц үг сэргээх",
      text: `Дараах холбоосоор нууц үгээ шинэчилнэ үү (1 цагийн дотор):\n${resetUrl}\n\nХэрэв та хүсээгүй бол энэ и-мэйлийг үл тоомсорлоно уу.`,
      html: `<p>Дараах товчоор нууц үгээ шинэчилнэ үү (1 цагийн дотор):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
