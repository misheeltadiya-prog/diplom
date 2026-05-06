import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDemoLoginEnabled } from "@/lib/demo-auth";

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string | null;
};

export async function GET(request: Request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Demo login is disabled." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedRole = searchParams.get("role");
  const roleFilter = requestedRole === "company" || requestedRole === "freelancer" ? requestedRole : null;

  const db = getDb();
  const [rows] = (await db.execute(
    `SELECT id, full_name, email, role
     FROM users
     WHERE role IN ('company', 'freelancer', 'admin')
       ${roleFilter ? "AND role = ?" : ""}
     ORDER BY role ASC, full_name ASC
     LIMIT 300`,
    roleFilter ? [roleFilter] : [],
  )) as [UserRow[], unknown];

  return NextResponse.json({
    ok: true,
    users: rows.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role ?? "client",
    })),
  });
}

