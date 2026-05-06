import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token байхгүй." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [hdr] = (await db.execute(
      `
        UPDATE users
        SET email_verified = 1,
            email_verify_token = NULL,
            email_verify_expires_at = NULL
        WHERE email_verify_token = ?
          AND (email_verify_expires_at IS NULL OR email_verify_expires_at > UTC_TIMESTAMP())
      `,
      [token],
    )) as [ResultSetHeader, unknown];

    if (!hdr.affectedRows) {
      return NextResponse.json({ error: "Холбоос хүчингүй эсвэл аль хэдийн баталгаажсан." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Серверийн алдаа." }, { status: 500 });
  }
}
