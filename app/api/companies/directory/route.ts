import { NextResponse } from "next/server";
import { getMergedCompaniesForDirectory } from "@/lib/company-directory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await getMergedCompaniesForDirectory();
    return NextResponse.json(
      { ok: true, companies },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[companies/directory]", error);
    return NextResponse.json({ ok: false, error: "Компаниудын жагсаалт уншихад алдаа гарлаа.", companies: [] }, { status: 500 });
  }
}
