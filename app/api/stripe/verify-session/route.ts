import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, getStripeKeyValidationError } from "@/lib/stripe-server";
import { stripeMetadataToCanonical } from "@/lib/subscription-tier";
import { getEffectiveSubscription, setUserPlan } from "@/lib/user-subscription";

export const runtime = "nodejs";

/**
 * Stripe Checkout success_url-ийн session_id-ээр төлбөрийг баталгаажуулж DB-д эрх бичнэ.
 * Webhook ирэхгүй/хойшилсон үед нөөц зам.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нэвтэрнэ үү." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    const keyErr = getStripeKeyValidationError();
    return NextResponse.json(
      { ok: false, error: keyErr ?? "Stripe тохируулаагүй." },
      { status: keyErr ? 400 : 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON буруу." }, { status: 400 });
  }

  const sessionId = typeof (body as { sessionId?: unknown }).sessionId === "string"
    ? (body as { sessionId: string }).sessionId.trim()
    : "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ ok: false, error: "sessionId буруу." }, { status: 400 });
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe/verify-session]", msg);
    return NextResponse.json(
      { ok: false, error: "Stripe session уншиж чадсангүй.", detail: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 502 },
    );
  }

  if (session.mode !== "subscription") {
    return NextResponse.json({ ok: false, error: "Subscription checkout биш." }, { status: 400 });
  }

  const sessionUserId = Number(session.metadata?.user_id || session.client_reference_id);
  if (!Number.isFinite(sessionUserId) || sessionUserId !== user.id) {
    return NextResponse.json({ ok: false, error: "Энэ төлбөр таны бүртгэлтэй таарахгүй байна." }, { status: 403 });
  }

  const canonical = stripeMetadataToCanonical(session.metadata?.plan_key ?? null);
  if (!canonical) {
    return NextResponse.json({ ok: false, error: "Төлөвлөгөөний metadata алга." }, { status: 400 });
  }

  if (session.status !== "complete") {
    return NextResponse.json({ ok: false, error: "Checkout дуусаагүй байна." }, { status: 409 });
  }

  const ps = session.payment_status;
  if (ps !== "paid" && ps !== "no_payment_required") {
    return NextResponse.json(
      { ok: false, error: `Төлбөрийн төлөв: ${ps ?? "—"}. Дахин оролдоно уу.` },
      { status: 409 },
    );
  }

  await setUserPlan(user.id, canonical);
  const sub = await getEffectiveSubscription(user.id);

  revalidatePath("/profile");
  revalidatePath("/profile/upgrade");

  return NextResponse.json({
    ok: true,
    plan: sub.planKey,
    status: sub.status,
    expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
  });
}
