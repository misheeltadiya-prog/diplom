import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getEmployees } from "@/lib/portal-data";

type EmployeePayload = {
  fullName?: string;
  roleTitle?: string;
  email?: string;
  phone?: string;
  skills?: string;
  bio?: string;
};

export async function GET() {
  const employees = await getEmployees();
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Эхлээд нэвтэрнэ үү." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as EmployeePayload;

    if (!body.fullName || !body.roleTitle || !body.email || !body.phone || !body.skills || !body.bio) {
      return NextResponse.json(
        { error: "Ажилтны бүх талбарыг бөглөнө үү." },
        { status: 400 },
      );
    }

    const db = getDb();

    await db.execute(
      `
        INSERT INTO employees
          (created_by, full_name, role_title, email, phone, skills, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [user.id, body.fullName, body.roleTitle, body.email, body.phone, body.skills, body.bio],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ажилтан хадгалах үед алдаа гарлаа." },
      { status: 500 },
    );
  }
}
