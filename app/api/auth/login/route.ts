import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type LoginPayload = {
  email?: string;
  password?: string;
  /** `/login?role=…`-аас илгээгдэнэ: таарахгүй бол session үүсгэхгүй. */
  intentRole?: string;
};

type LoginRow = {
  id: number;
  password_hash: string;
  role?: string | null;
};

export async function POST(request: Request) {
  // Rate limit: 10 attempts per minute per IP
  const ip = getClientIp(request);
  const limit = checkRateLimit(`login:${ip}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Хэт олон оролдлого. 1 минутын дараа дахин оролдоно уу." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as LoginPayload;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "И-мэйл болон нууц үгээ оруулна уу." },
        { status: 400 },
      );
    }

    const db = getDb();
    let rows: LoginRow[];
    try {
      const [r] = (await db.execute(
        `
          SELECT id, password_hash, role
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [body.email.toLowerCase()],
      )) as [LoginRow[], unknown];
      rows = r;
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
      const [r] = (await db.execute(
        `
          SELECT id, password_hash
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [body.email.toLowerCase()],
      )) as [LoginRow[], unknown];
      rows = r;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "И-мэйл эсвэл нууц үг буруу байна." },
        { status: 401 },
      );
    }

    const user = rows[0];
    const matches = verifyPassword(body.password, user.password_hash);

    if (!matches) {
      return NextResponse.json(
        { error: "И-мэйл эсвэл нууц үг буруу байна." },
        { status: 401 },
      );
    }

    const roleOut =
      user.role === "freelancer" || user.role === "admin" || user.role === "company"
        ? (user.role as "freelancer" | "admin" | "company")
        : "client";

    const intentRaw = typeof body.intentRole === "string" ? body.intentRole.trim() : "";
    if (intentRaw === "company" && roleOut !== "company" && roleOut !== "admin") {
      return NextResponse.json(
        {
          code: "ROLE_INTENT_MISMATCH",
          error:
            "Энэ данс company бүртгэл биш. Ажлын зар оруулахын тулд /register?role=company-оор шинээр бүртгүүлээд тэр дансаар нэвтэрнэ үү.",
        },
        { status: 403 },
      );
    }
    if (intentRaw === "freelancer" && roleOut !== "freelancer" && roleOut !== "admin") {
      return NextResponse.json(
        {
          code: "ROLE_INTENT_MISMATCH",
          error:
            "Энэ данс freelancer бүртгэл биш. /register?role=freelancer-оор шинээр бүртгүүлээд нэвтэрнэ үү.",
        },
        { status: 403 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true, role: roleOut });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Нэвтрэх үед алдаа гарлаа." },
      { status: 500 },
    );
  }
}
