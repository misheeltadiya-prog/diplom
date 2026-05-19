import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  appOriginFromRequest,
  getStripe,
  getStripeKeyValidationError,
  getStripePriceIdForCheckout,
} from "@/lib/stripe-server";
import { isPaidTier, stripeMetadataToCanonical } from "@/lib/subscription-tier";
import { getEffectiveSubscription } from "@/lib/user-subscription";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нэвтэрнэ үү." }, { status: 401 });
  }

  const keyErr = getStripeKeyValidationError();
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        ok: false,
        error: keyErr ?? "Stripe тохируулаагүй (STRIPE_SECRET_KEY).",
        stripeConfigured: false,
        hint:
          "Локал: .env.local эсвэл npm run dev-ийн өмнө $env:STRIPE_SECRET_KEY. Vercel: STRIPE_SECRET_KEY + STRIPE_PRICE_ID_PRO/BUSINESS (эсвэл PREMIUM/STANDARD).",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }

  const rawPlan = (body as { planKey?: string }).planKey?.toLowerCase().trim() ?? "";
  const canonical = stripeMetadataToCanonical(rawPlan);
  if (!canonical) {
    return NextResponse.json(
      { ok: false, error: "planKey: standard, premium эсвэл legacy business, pro." },
      { status: 400 },
    );
  }

  const current = await getEffectiveSubscription(user.id);
  const now = Date.now();
  const paidActive =
    isPaidTier(current.planKey) &&
    current.status === "active" &&
    (!current.expiresAt || current.expiresAt.getTime() > now);

  if (paidActive && current.planKey === canonical) {
    return NextResponse.json(
      {
        ok: false,
        alreadyActive: true,
        error: "Энэ төлөвлөгөө аль хэдийн идэвхтэй. Дахин төлбөр төлөх шаардлаггүй.",
        plan: current.planKey,
        expiresAt: current.expiresAt ? current.expiresAt.toISOString() : null,
      },
      { status: 409 },
    );
  }

  const priceId = getStripePriceIdForCheckout(rawPlan);
  if (!priceId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          canonical === "premium"
            ? "STRIPE_PRICE_ID_PREMIUM эсвэл STRIPE_PRICE_ID_PRO тохируулаагүй."
            : "STRIPE_PRICE_ID_STANDARD эсвэл STRIPE_PRICE_ID_BUSINESS тохируулаагүй.",
        stripeConfigured: true,
        hint: "Stripe Dashboard → Products → subscription Price ID-г Vercel env-д нэг мөрөөр оруулна.",
      },
      { status: 503 },
    );
  }

  const origin = appOriginFromRequest(req);

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile/upgrade?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile/upgrade?checkout=cancel`,
      client_reference_id: String(user.id),
      metadata: { plan_key: canonical, user_id: String(user.id) },
      subscription_data: {
        metadata: { plan_key: canonical, user_id: String(user.id) },
      },
      customer_email: user.email || undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[stripe/checkout]", message);
    const connectionLike =
      /connection to Stripe|Request was retried|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|getaddrinfo/i.test(
        message,
      );
    const devDetail = process.env.NODE_ENV === "development" ? message : undefined;
    if (connectionLike) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Stripe API руу Node-оос холболт амжилтгүй. GET /api/stripe/health (нэвтэрсэн) эсвэл npm run stripe:ping — алдааны шалтгааныг задлана. IPv4 agent: stripe-server. Идэвхгүй болгох: STRIPE_DNS_IPV4FIRST=0",
          detail: devDetail,
        },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          "Stripe Checkout үүсгэж чадсангүй. STRIPE_SECRET_KEY, subscription Price ID-уудыг шалгана уу.",
        detail: devDetail,
      },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json({ ok: false, error: "Checkout URL үүсээгүй." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: session.url });
}
