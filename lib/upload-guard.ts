import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/** Image upload endpoint-уудын rate limit (banner, logo, avatar). */
export function guardUploadRate(request: Request, userId: number, kind: string) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`upload:${kind}:${userId}:${ip}`, {
    windowMs: 60_000,
    max: 12,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Хэт олон upload. 1 минутын дараа дахин оролдоно уу." },
      { status: 429 },
    );
  }
  return null;
}
