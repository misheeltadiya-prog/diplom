import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe-server";
import { stripeMetadataToCanonical } from "@/lib/subscription-tier";
import { logger } from "@/lib/logger";
import { setUserPlan } from "@/lib/user-subscription";

export const runtime = "nodejs";

function revalidateProfileSubscription() {
  revalidatePath("/profile");
  revalidatePath("/profile/upgrade");
}

async function applyPlanFromStripeMetadata(meta: Stripe.Metadata | null | undefined) {
  const canonical = stripeMetadataToCanonical(meta?.plan_key ?? null);
  const userId = Number(meta?.user_id);
  if (userId > 0 && canonical) {
    await setUserPlan(userId, canonical);
    revalidateProfileSubscription();
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const whSecret = getStripeWebhookSecret();
  if (!stripe || !whSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook тохируулаагүй." }, { status: 503 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "stripe-signature байхгүй." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (e) {
    logger.warn("stripe_webhook_signature_invalid", {
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: false, error: "Webhook signature буруу." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription") {
      const planKey = session.metadata?.plan_key;
      const fromMeta = session.metadata?.user_id;
      const userId = Number(fromMeta || session.client_reference_id);
      const canonical = stripeMetadataToCanonical(planKey ?? null);
      if (userId > 0 && canonical) {
        await setUserPlan(userId, canonical);
        logger.info("stripe_checkout_completed", { userId, plan: canonical });
        revalidateProfileSubscription();
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    if (sub.status === "active" || sub.status === "trialing") {
      await applyPlanFromStripeMetadata(sub.metadata);
    }
  }

  return NextResponse.json({ received: true });
}
