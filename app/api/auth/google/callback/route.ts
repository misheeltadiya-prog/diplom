import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { resolveGoogleLogin } from "@/lib/auth-google";
import { createSession } from "@/lib/auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthConfig } from "@/lib/google-oauth";
import {
  clearGoogleOAuthPending,
  readGoogleOAuthPending,
  type GoogleOAuthPending,
} from "@/lib/oauth-state-cookie";
import { postLoginPath } from "@/lib/post-login-redirect";

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
  const { searchParams } = new URL(request.url);
  const oauthError = searchParams.get("error");
  if (oauthError) {
    await clearGoogleOAuthPending();
    return oauthErrorRedirect(request, oauthError === "access_denied" ? "cancelled" : "google_denied");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return oauthErrorRedirect(request, "invalid_callback");
  }

  const pending = await readGoogleOAuthPending();
  await clearGoogleOAuthPending();

  if (!pending || pending.state !== state) {
    return oauthErrorRedirect(request, "invalid_state", pending);
  }

  const config = getGoogleOAuthConfig(request);
  if (!config) {
    return oauthErrorRedirect(request, "not_configured", pending);
  }

  try {
    const profile = await exchangeCodeForGoogleProfile(config, code);
    const result = await resolveGoogleLogin(profile, pending.intentRole);

    if (!result.ok) {
      if (result.code === "GOOGLE_ID_COLUMN_MISSING") {
        return oauthErrorRedirect(request, "migration_required", pending);
      }
      if (result.code === "ROLE_INTENT_MISMATCH") {
        return oauthErrorRedirect(request, "role_mismatch", pending);
      }
      return oauthErrorRedirect(request, "email_required", pending);
    }

    await createSession(result.userId);

    const dest = postLoginPath(result.role, {
      next: pending.next,
      isNewOAuthUser: result.isNewUser,
    });
    return NextResponse.redirect(new URL(dest, request.url));
  } catch (err) {
    console.error("[google-oauth-callback]", err);
    return oauthErrorRedirect(request, "server_error", pending);
  }
}
