import { NextResponse } from "next/server";
import { getCvProfileByUserId } from "@/lib/profile-cv";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const userId = Number(id);

  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  try {
    const profile = await getCvProfileByUserId(userId);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CV уншихад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
