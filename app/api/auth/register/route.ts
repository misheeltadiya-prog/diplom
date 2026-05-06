import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicAppUrl, sendTransactionalEmail } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type RegisterPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
};

export async function POST(request: Request) {
  // Rate limit: 5 registrations per 10 minutes per IP
  const ip = getClientIp(request);
  const limit = checkRateLimit(`register:${ip}`, { windowMs: 600_000, max: 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Хэт олон бүртгэл. 10 минутын дараа дахин оролдоно уу." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as RegisterPayload;

    if (!body.fullName || !body.phone || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Нэр, утас, и-мэйл, нууц үг бүгд шаардлагатай." },
        { status: 400 },
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Нууц үг хамгийн багадаа 6 тэмдэгт байна." },
        { status: 400 },
      );
    }

    const db = getDb();
    const passwordHash = hashPassword(body.password);
    const role =
      body.role === "freelancer"
        ? "freelancer"
        : body.role === "company"
          ? "company"
          : "client";
    const verifyToken = randomBytes(24).toString("hex");
    const emailLower = body.email.toLowerCase();

    const origin = new URL(request.url).origin;
    let userId: number;
    let verifyUrl: string | null = null;
    try {
      const [result] = (await db.execute(
        `
          INSERT INTO users (
            full_name, phone, email, password_hash, role,
            email_verified, email_verify_token, email_verify_expires_at
          )
          VALUES (?, ?, ?, ?, ?, 0, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 48 HOUR))
        `,
        [body.fullName, body.phone, emailLower, passwordHash, role, verifyToken],
      )) as [{ insertId: number }, unknown];
      userId = result.insertId;
      verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(verifyToken)}`;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code !== "ER_BAD_FIELD_ERROR") {
        throw e;
      }
      try {
        const [result] = (await db.execute(
          `INSERT INTO users (full_name, phone, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [body.fullName, body.phone, emailLower, passwordHash, role],
        )) as [{ insertId: number }, unknown];
        userId = result.insertId;
      } catch (e2: unknown) {
        if ((e2 as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
          throw e2;
        }
        const [result] = (await db.execute(
          `INSERT INTO users (full_name, phone, email, password_hash) VALUES (?, ?, ?, ?)`,
          [body.fullName, body.phone, emailLower, passwordHash],
        )) as [{ insertId: number }, unknown];
        userId = result.insertId;
      }
    }

    if (!userId) {
      throw new Error("Хэрэглэгч үүсгэж чадсангүй.");
    }

    /* Хуучин schema-д INSERT-д role ороогүй эсвэл зөвхөн DEFAULT client болсон тохиолдлыг засна */
    try {
      await db.execute(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
      try {
        await db.execute(`DELETE FROM users WHERE id = ?`, [userId]);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        {
          error:
            "Өгөгдлийн санд `users.role` багана байхгүй эсвэл ENUM-д freelancer/company байхгүй байна. MySQL дээр database/migrations/005_users_role_column.sql (болон шаардлагатай бол 003) ажиллуулна уу. " +
            msg,
        },
        { status: 500 },
      );
    }

    await createSession(userId);

    if (verifyUrl && process.env.NODE_ENV === "production") {
      const verifyLink = publicAppUrl(`/verify-email?token=${encodeURIComponent(verifyToken)}`);
      await sendTransactionalEmail({
        to: emailLower,
        subject: "C-Work — и-мэйл баталгаажуулах",
        text: `Бүртгэлээ баталгаажуулах:\n${verifyLink}`,
        html: `<p>Дараах товчоор и-мэйлээ баталгаажуулна уу:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
      });
    }

    return NextResponse.json({
      ok: true,
      userId,
      role,
      ...(process.env.NODE_ENV !== "production" && verifyUrl ? { devVerifyEmailUrl: verifyUrl } : {}),
    });
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: dbError.message ?? "Бүртгэх үед алдаа гарлаа." },
      { status: 500 },
    );
  }
}
