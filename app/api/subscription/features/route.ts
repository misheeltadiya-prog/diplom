import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { getSubscriptionPayloadForApi } from "@/services/subscriptionService";

export const dynamic = "force-dynamic";

/** GET: одоогийн tier, AI feature flag, хязгаарууд (UI / client logic-д). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    const payload = await getSubscriptionPayloadForApi(user.id);
    return NextResponse.json({ ok: true, ...payload });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: mysqlErrorToUserMessage(e) },
      { status: 500 },
    );
  }
}
