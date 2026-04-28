import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    await db.query("SELECT 1");
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed.";
    return NextResponse.json(
      { ok: false, database: "disconnected", error: message },
      { status: 500 },
    );
  }
}
