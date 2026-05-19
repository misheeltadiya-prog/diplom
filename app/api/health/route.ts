import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEnvStatus } from "@/lib/env";
import { getStripe } from "@/lib/stripe-server";

export async function GET() {
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
        qpay: env.qpay,
        realtime: env.realtime,
        issueCount: env.issues.length,
      },
      issues: env.issues,
    },
    { status: ok ? 200 : 503 },
  );
}
