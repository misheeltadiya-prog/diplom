import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { type JobSeekerPublic, type JobSeekerRow, mapJobSeekerRow } from "@/lib/job-seekers";

function jobSeekersErrorMessage(error: unknown): string {
  const err = error as Error & { code?: string; errno?: number };
  if (err.code === "ER_NO_SUCH_TABLE") {
    return "MySQL дээр job_seeker_profiles хүснэгт алга. Эхлээд database/schema.sql, дараа нь database/workbench-seed.sql ажиллуулна уу.";
  }
  if (err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return "MySQL руу холбогдож чадсангүй — .env (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE) шалгана уу.";
  }
  if (err.message?.includes("environment variable is missing")) {
    return "MySQL орчны хувьсагч (.env) дутуу байна.";
  }
  return err.message ?? "Өгөгдөл авахад алдаа гарлаа.";
}

export async function GET() {
  try {
    const db = getDb();
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
        id,
        initials,
        full_name,
        role_title,
        short_description,
        detail_description,
        skills_json,
        price_label,
        stars_label,
        rating,
        reviews_count,
        accent,
        badge_label,
        badge_tone
      FROM job_seeker_profiles
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC`,
    );
    const jobSeekers = rows.map((r) => mapJobSeekerRow(r as JobSeekerRow));
    return NextResponse.json({ jobSeekers });
  } catch (error) {
    console.error("[api/job-seekers]", error);
    const message = jobSeekersErrorMessage(error);
    return NextResponse.json(
      { jobSeekers: [] as JobSeekerPublic[], error: message },
      { status: 200 },
    );
  }
}
