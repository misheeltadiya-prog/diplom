import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type ProfilePayload = {
  fullName?: string;
  email?: string;
  phone?: string;
};

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ProfilePayload;
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required." }, { status: 400 });
    }

    const db = getDb();

    await db.execute(
      `
        UPDATE users
        SET
          full_name = ?,
          email = ?,
          phone = ?
        WHERE id = ?
      `,
      [fullName, email, phone, currentUser.id],
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: currentUser.id,
        fullName,
        email,
        phone,
        createdAt: currentUser.createdAt,
      },
    });
  } catch (error: unknown) {
    const dbError = error as { code?: string; message?: string };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }

    return NextResponse.json(
      { error: dbError.message ?? "Could not update your profile right now." },
      { status: 500 },
    );
  }
}
