import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getStripe,
  getStripeKeyValidationError,
  getStripePriceId,
  stripeClientUsesIpv4Agent,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

/**
 * Нэвтэрсэн хэрэглэгчид Stripe холболтыг шалгана (Checkout 502-ийг задлахад).
 * GET /api/stripe/health — браузераас нээж болно (нэвтэрсэн байх ёстой).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нэвтэрнэ үү." }, { status: 401 });
  }

  const stripe = getStripe();
  const ipv4Agent = stripeClientUsesIpv4Agent();
  const pricePro = Boolean(getStripePriceId("pro"));
  const priceBusiness = Boolean(getStripePriceId("business"));

  if (!stripe) {
    const keyErr = getStripeKeyValidationError();
    return NextResponse.json({
      ok: false,
      step: keyErr ? "invalid_stripe_secret" : "missing_stripe_secret",
      keyError: keyErr,
      ipv4Agent,
      priceProConfigured: pricePro,
      priceBusinessConfigured: priceBusiness,
      hint: keyErr
        ? keyErr
        : "STRIPE_SECRET_KEY .env.local эсвэл terminal орчинд байгаа эсэхийг шалгана уу.",
    });
  }

  const started = Date.now();
  try {
    await stripe.balance.retrieve();
    const ms = Date.now() - started;
    return NextResponse.json({
      ok: true,
      step: "balance_ok",
      ms,
      ipv4Agent,
      priceProConfigured: pricePro,
      priceBusinessConfigured: priceBusiness,
      platform: process.platform,
      node: process.version,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const ms = Date.now() - started;
    return NextResponse.json({
      ok: false,
      step: "stripe_request_failed",
      ms,
      ipv4Agent,
      priceProConfigured: pricePro,
      priceBusinessConfigured: priceBusiness,
      platform: process.platform,
      node: process.version,
      error: message,
    });
  }
}
