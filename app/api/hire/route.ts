import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

type Body = { freelancerUserId?: number; jobId?: string; message?: string };

/**
 * Hire flow-ийн placeholder. Төлбөр / гэрээний дараа энд бизнес логик нэмнэ.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }
  if (user.role !== "client" && user.role !== "admin") {
    return NextResponse.json({ error: "Зөвхөн client hire хийх боломжтой." }, { status: 403 });
  }

  const body = (await request.json()) as Body;
  if (!body.freelancerUserId) {
    return NextResponse.json({ error: "freelancerUserId шаардлагатай." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    stub: true,
    message: "Hire flow одоогоор placeholder — гэрээ/төлбөрийн модуль нэмэгдээгүй байна.",
    received: {
      hirerId: user.id,
      freelancerUserId: body.freelancerUserId,
      jobId: body.jobId ?? null,
      note: body.message ?? null,
    },
  });
}
