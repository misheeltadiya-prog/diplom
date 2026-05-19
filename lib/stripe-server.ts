import https from "node:https";
import Stripe from "stripe";

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Stripe руу олон орчинд IPv6 маршрут эвдэрсэн байдаг тул үндсээрээ IPv4 HTTPS agent.
 * Идэвхгүй болгох: STRIPE_DNS_IPV4FIRST=0
 */
function stripeHttpAgent(): https.Agent | undefined {
  const raw = process.env.STRIPE_DNS_IPV4FIRST?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") {
    return undefined;
  }
  return new https.Agent({ family: 4 });
}

/** Health endpoint-д зориулсан товч тэмдэглэл */
export function stripeClientUsesIpv4Agent(): boolean {
  return stripeHttpAgent() !== undefined;
}

function normalizeStripeSecretKey(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

/** Secret key зөв эсэхийг эрт шалгана (буруу бол Stripe "Invalid API Key" өгнө). */
export function validateStripeSecretKeyForApp(): { ok: true; key: string } | { ok: false; error: string } {
  const raw = process.env.STRIPE_SECRET_KEY;
  if (!raw?.trim()) {
    return { ok: false, error: "STRIPE_SECRET_KEY байхгүй." };
  }
  let key = normalizeStripeSecretKey(raw).replace(/^\uFEFF/, "");
  if (/[\r\n]/.test(key) || /price_id\s*=/i.test(key)) {
    return {
      ok: false,
      error:
        "STRIPE_SECRET_KEY нэг мөр биш (дотор нь Enter эсвэл «price_id =» орсон). $env хашилтын дотор шинэ мөр дарж болохгүй — Secret key-г Dashboard-оос дахин нэг мөрөөр .env.local эсвэл тусад $env мөрөнд оруулна.",
    };
  }
  if (key.startsWith("pk_test_") || key.startsWith("pk_live_")) {
    return {
      ok: false,
      error:
        "Publishable key (pk_...) орсон. Dashboard → API keys → **Secret key** (sk_test_ / sk_live_) хуулна.",
    };
  }
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    return {
      ok: false,
      error:
        "STRIPE_SECRET_KEY нь Secret key биш (sk_test_ эсвэл sk_live_ эхлэх ёстой). Эхэнд илүү зай эсвэл буруу хэсэг хуулсан эсэхийг шалгана уу.",
    };
  }
  if (key.length < 20) {
    return { ok: false, error: "STRIPE_SECRET_KEY хэт богино — бүтэн нэг мөрөөр дахин хуулна уу." };
  }
  return { ok: true, key };
}

/** getStripe() null буцаасан үед яг юу буруу байгааг харуулахад. */
export function getStripeKeyValidationError(): string | null {
  const checked = validateStripeSecretKeyForApp();
  return checked.ok ? null : checked.error;
}

export function getStripe(): Stripe | null {
  const checked = validateStripeSecretKeyForApp();
  if (!checked.ok) return null;
  const key = checked.key;
  const maxNetworkRetries = intEnv("STRIPE_API_MAX_NETWORK_RETRIES", 4);
  const timeout = intEnv("STRIPE_API_TIMEOUT_MS", 120000);
  const httpAgent = stripeHttpAgent();
  return new Stripe(key, {
    typescript: true,
    maxNetworkRetries,
    timeout,
    ...(httpAgent ? { httpAgent } : {}),
  });
}

export function getStripePriceId(planKey: "pro" | "business"): string | null {
  const raw =
    planKey === "pro" ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID_BUSINESS;
  const id = raw?.trim();
  return id || null;
}

/**
 * Checkout body: `standard` | `premium` | legacy `business` | `pro`.
 * Premium → STRIPE_PRICE_ID_PREMIUM эсвэл STRIPE_PRICE_ID_PRO.
 * Standard → STRIPE_PRICE_ID_STANDARD эсвэл STRIPE_PRICE_ID_BUSINESS.
 */
export function getStripePriceIdForCheckout(planKey: string): string | null {
  const s = planKey.toLowerCase().trim();
  if (s === "premium" || s === "pro") {
    return (
      process.env.STRIPE_PRICE_ID_PREMIUM?.trim() ||
      process.env.STRIPE_PRICE_ID_PRO?.trim() ||
      null
    );
  }
  if (s === "standard" || s === "business") {
    return (
      process.env.STRIPE_PRICE_ID_STANDARD?.trim() ||
      process.env.STRIPE_PRICE_ID_BUSINESS?.trim() ||
      null
    );
  }
  return null;
}

export function getStripeWebhookSecret(): string | null {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return s || null;
}

/**
 * Stripe success/cancel URL, OAuth redirect зэрэгт ашиглана.
 * NEXT_PUBLIC_APP_URL нь бодит Next порттой зөрвөл (жишээ нь :3000 дээр Grafana, Next :3001)
 * идэвхтэй хүсэлтийн origin-ийг сонгоно.
 */
function cleanPublicOrigin(raw: string | undefined): string | null {
  const cleaned = raw?.trim().replace(/^<|>$/g, "").replace(/\/$/, "");
  if (cleaned && (cleaned.startsWith("http://") || cleaned.startsWith("https://"))) {
    return cleaned;
  }
  return null;
}

export function appOriginFromRequest(req: Request): string {
  const requestOrigin = new URL(req.url).origin;
  const fromEnv =
    cleanPublicOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    cleanPublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (!fromEnv) {
    return requestOrigin;
  }

  try {
    const envUrl = new URL(fromEnv);
    const reqUrl = new URL(requestOrigin);
    if (
      envUrl.protocol === reqUrl.protocol &&
      envUrl.hostname === reqUrl.hostname &&
      envUrl.port !== reqUrl.port
    ) {
      return requestOrigin;
    }
  } catch {
    return requestOrigin;
  }

  return fromEnv;
}
