import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mysqlErrorToUserMessage } from "@/lib/mysql-errors";
import { getEffectiveSubscription, setUserPlan, type PlanKey } from "@/lib/user-subscription";

/** POST: зөвхөн үнэгүй (basic) руу шилжүүлэх — бусад төлөвлөгөө Stripe. */
function parseFreePlanKey(raw: unknown): PlanKey | null {
  if (raw === "basic" || raw === "free") return "basic";
  return null;
}

/** GET: одоогийн subscription (basic|standard|premium). POST: зөвхөн BASIC — төлбөртэйг Stripe. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  try {
    const sub = await getEffectiveSubscription(user.id);
    return NextResponse.json({
      ok: true,
      plan: sub.planKey,
      status: sub.status,
      expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: mysqlErrorToUserMessage(e) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON буруу байна." }, { status: 400 });
  }

  const planKey = parseFreePlanKey((body as { planKey?: unknown }).planKey);
  if (!planKey) {
    return NextResponse.json(
      { ok: false, error: "Зөвхөн planKey: basic эсвэл free (Үнэгүй) илгээнэ үү. Төлбөртэйг Stripe-аас." },
      { status: 403 },
    );
  }

  try {
    const { expiresAt } = await setUserPlan(user.id, planKey);
    return NextResponse.json({
      ok: true,
      plan: planKey,
      status: "active",
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: mysqlErrorToUserMessage(e) }, { status: 500 });
  }
}
