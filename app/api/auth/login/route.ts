import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

type LoginPayload = {
  email?: string;
  password?: string;
};

type LoginRow = {
  id: number;
  password_hash: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "И-мэйл болон нууц үгээ оруулна уу." },
        { status: 400 },
      );
    }

    const db = getDb();
    const [rows] = (await db.execute(
      `
        SELECT id, password_hash
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [body.email.toLowerCase()],
    )) as [LoginRow[], unknown];

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

    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Нэвтрэх үед алдаа гарлаа." },
      { status: 500 },
    );
  }
}
