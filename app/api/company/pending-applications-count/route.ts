import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyPendingApplicationsCount } from "@/lib/company-application-stats";

export const dynamic = "force-dynamic";

/** Компанийн шийдвэр хүлээж буй өргөдлийн тоо (profile / nav тэмдэгт) */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "company") {
    return NextResponse.json({ ok: true, count: 0 }, { headers: { "Cache-Control": "no-store" } });
  }

  const count = await getCompanyPendingApplicationsCount(user);
  return NextResponse.json({ ok: true, count }, { headers: { "Cache-Control": "no-store" } });
}
