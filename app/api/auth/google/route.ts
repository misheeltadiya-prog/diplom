import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/google-oauth";
import { createSignedOAuthState } from "@/lib/oauth-state-signed";
import { applyGoogleOAuthPendingCookie, type GoogleOAuthPending } from "@/lib/oauth-state-cookie";

function oauthErrorRedirect(
  req: Request,
  code: string,
  pending?: Pick<GoogleOAuthPending, "returnTo" | "intentRole"> | null,
) {
  const base = pending?.returnTo === "register" ? "/register" : "/login";
  const url = new URL(base, req.url);
  url.searchParams.set("oauth_error", code);
  if (pending?.intentRole === "company" || pending?.intentRole === "freelancer") {
    url.searchParams.set("role", pending.intentRole);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const config = getGoogleOAuthConfig(request);
  if (!config) {
    return oauthErrorRedirect(request, "not_configured");
  }

  const { searchParams } = new URL(request.url);
  const roleRaw = searchParams.get("role")?.trim();
  const intentRole =
    roleRaw === "company" ? "company" : roleRaw === "freelancer" ? "freelancer" : undefined;
  const nextRaw = searchParams.get("next")?.trim();
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("://")
      ? nextRaw
      : undefined;
  const returnTo = searchParams.get("signup") === "1" ? "register" : "login";

  const state = createSignedOAuthState({ intentRole, next, returnTo });
  const pending: GoogleOAuthPending = { state, intentRole, next, returnTo };

  const authUrl = buildGoogleAuthUrl(config, state);
  const response = NextResponse.redirect(authUrl);
  applyGoogleOAuthPendingCookie(response, pending);
  return response;
}
