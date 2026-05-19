import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnvStatus } from "@/lib/env";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const env = getEnvStatus();
  let database: "connected" | "disconnected" = "disconnected";
  let dbError: string | undefined;

  try {
    const db = getDb();
    await db.query("SELECT 1");
    database = "connected";
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Database connection failed.";
  }

  const stripeClient = getStripe();
  const googleOAuth = getGoogleOAuthConfig(request);
  const ok = database === "connected";

  return NextResponse.json(
    {
      ok,
      database,
      dbError,
      env: {
        nodeEnv: env.nodeEnv,
        smtp: env.smtp,
        s3: env.s3,
        stripe: env.stripe,
        stripeWebhook: env.stripeWebhook,
        gemini: env.gemini,
        geminiModel: env.geminiModel,
        geminiKeySource: env.geminiKeySource,
        geminiKeyLength: env.geminiKeyLength,
        geminiHint: env.gemini
          ? undefined
          : "Vercel → Settings → Environment Variables → GEMINI_API_KEY (Production) → дараа нь Deployments → Redeploy (Build cache асаахгүй).",
        googleOAuth: env.googleOAuth,
        googleRedirectUri: googleOAuth?.redirectUri ?? null,
        googleOAuthHint: env.googleOAuth
          ? undefined
          : "Vercel → GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET → Google Console redirect: …/api/auth/google/callback → Redeploy.",
        qpay: env.qpay,
        realtime: env.realtime,
        issueCount: env.issues.length,
      },
      issues: env.issues,
    },
    { status: ok ? 200 : 503 },
  );
}
