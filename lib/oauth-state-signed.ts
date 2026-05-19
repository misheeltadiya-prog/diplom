import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export type SignedOAuthPayload = {
  intentRole?: "company" | "freelancer";
  next?: string;
  returnTo?: "login" | "register";
  nonce: string;
};

function stateSecret(): string {
  return (
    process.env.OAUTH_STATE_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "cwork-oauth-dev-only"
  );
}

export function createSignedOAuthState(
  payload: Omit<SignedOAuthPayload, "nonce">,
): string {
  const bodyObj: SignedOAuthPayload = {
    ...payload,
    nonce: randomBytes(16).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(bodyObj), "utf8").toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseSignedOAuthState(state: string): SignedOAuthPayload | null {
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  if (!body || !sig) return null;

  const expected = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignedOAuthPayload;
    if (!parsed?.nonce || typeof parsed.nonce !== "string") return null;
    if (parsed.intentRole && parsed.intentRole !== "company" && parsed.intentRole !== "freelancer") {
      return null;
    }
    if (parsed.returnTo && parsed.returnTo !== "login" && parsed.returnTo !== "register") {
      return null;
    }
    if (
      parsed.next &&
      (typeof parsed.next !== "string" || !parsed.next.startsWith("/") || parsed.next.startsWith("//"))
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
