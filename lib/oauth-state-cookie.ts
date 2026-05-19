import { cookies } from "next/headers";

const COOKIE_NAME = "google_oauth_pending";
const MAX_AGE_SEC = 600;

export type GoogleOAuthPending = {
  state: string;
  intentRole?: "company" | "freelancer";
  next?: string;
  /** Алдаа буцаах хуудас */
  returnTo?: "login" | "register";
};

function encodePayload(payload: GoogleOAuthPending): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(raw: string): GoogleOAuthPending | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as GoogleOAuthPending;
    if (!parsed?.state || typeof parsed.state !== "string") return null;
    if (parsed.intentRole && parsed.intentRole !== "company" && parsed.intentRole !== "freelancer") {
      return null;
    }
    if (parsed.next && (typeof parsed.next !== "string" || !parsed.next.startsWith("/") || parsed.next.startsWith("//"))) {
      return null;
    }
    if (parsed.returnTo && parsed.returnTo !== "login" && parsed.returnTo !== "register") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setGoogleOAuthPending(payload: GoogleOAuthPending) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodePayload(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function readGoogleOAuthPending(): Promise<GoogleOAuthPending | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodePayload(raw);
}

export async function clearGoogleOAuthPending() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
