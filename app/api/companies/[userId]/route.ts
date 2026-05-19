import { NextResponse } from "next/server";
import { getCompanyProfileByUserId } from "@/lib/company-directory";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { userId: raw } = await context.params;
  const userId = Number(raw);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ ok: false, error: "Буруу компани ID." }, { status: 400 });
  }

  const company = await getCompanyProfileByUserId(userId);
  if (!company) {
    return NextResponse.json({ ok: false, error: "Компани олдсонгүй." }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, company },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
