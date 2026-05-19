import { randomBytes } from "crypto";
import { appOriginFromRequest } from "@/lib/stripe-server";
import { getSiteUrl } from "@/lib/site-url";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES = ["openid", "email", "profile"].join(" ");

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified?: boolean;
};

/** OAuth redirect_uri — production дээр NEXT_PUBLIC_SITE_URL, dev дээр идэвхтэй порт */
export function getOAuthAppOrigin(req: Request): string {
  if (process.env.NODE_ENV === "production") {
    return getSiteUrl();
  }
  return appOriginFromRequest(req);
}

export function getGoogleOAuthConfig(req: Request): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const origin = getOAuthAppOrigin(req);
  return {
    clientId,
    clientSecret,
    redirectUri: `${origin.replace(/\/$/, "")}/api/auth/google/callback`,
  };
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function buildGoogleAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export function newOAuthStateToken(): string {
  return randomBytes(24).toString("hex");
}

export async function exchangeCodeForGoogleProfile(
  config: GoogleOAuthConfig,
  code: string,
): Promise<GoogleProfile> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || !tokenJson.access_token) {
    const detail = tokenJson.error_description ?? tokenJson.error ?? tokenRes.statusText;
    throw new Error(`Google token алдаа: ${detail}`);
  }

  const userRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  const user = (await userRes.json()) as {
    id?: string;
    email?: string;
    verified_email?: boolean;
    name?: string;
    picture?: string;
    error?: { message?: string };
  };

  if (!userRes.ok || !user.id || !user.email) {
    const detail = user.error?.message ?? userRes.statusText;
    throw new Error(`Google профайл уншихад алдаа: ${detail}`);
  }

  return {
    sub: user.id,
    email: user.email.toLowerCase(),
    name: (user.name ?? user.email.split("@")[0]).trim() || "Google хэрэглэгч",
    picture: user.picture,
    emailVerified: user.verified_email === true,
  };
}
