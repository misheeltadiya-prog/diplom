import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";

export const runtime = "nodejs";

/** Dev шалгалт: GET /api/auth/google/health */
export async function GET(request: Request) {
  const config = getGoogleOAuthConfig(request);
  return NextResponse.json({
    configured: Boolean(config),
    hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
    redirectUri: config?.redirectUri ?? null,
  });
}
