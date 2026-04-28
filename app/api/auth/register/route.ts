import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

type RegisterPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
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

    const [result] = (await db.execute(
      `
        INSERT INTO users (full_name, phone, email, password_hash)
        VALUES (?, ?, ?, ?)
      `,
      [body.fullName, body.phone, body.email.toLowerCase(), passwordHash],
    )) as [{ insertId: number }, unknown];

    const userId = result.insertId;

    if (!userId) {
      throw new Error("Хэрэглэгч үүсгэж чадсангүй.");
    }

    await createSession(userId);

    return NextResponse.json({ ok: true, userId });
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
