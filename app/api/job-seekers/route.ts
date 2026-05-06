import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { type JobSeekerPublic, mapRegisteredFreelancerRow } from "@/lib/job-seekers";

export const dynamic = "force-dynamic";

function jobSeekersErrorMessage(error: unknown): string {
  const err = error as Error & { code?: string; errno?: number };
  if (err.code === "ER_NO_SUCH_TABLE") {
    return "MySQL дээр хүснэгт алга. Эхлээд database/schema.sql болон database/migrations/ ажиллуулна уу.";
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
    let registered: JobSeekerPublic[] = [];
    try {
      const [regRows] = await db.query<RowDataPacket[]>(
        `SELECT fp.user_id, u.full_name, fp.role_title, fp.short_description, fp.detail_description,
                fp.skills_json, fp.price_label, fp.rating, fp.reviews_count, fp.accent,
                IFNULL(fp.portfolio_json, '[]') AS portfolio_json
         FROM freelancer_profiles fp
         INNER JOIN users u ON u.id = fp.user_id
         WHERE fp.is_active = 1 AND u.role = 'freelancer'
         ORDER BY fp.updated_at DESC
         LIMIT 500`,
      );
      registered = regRows.map((r) =>
        mapRegisteredFreelancerRow(
          r as {
            user_id: number;
            full_name: string;
            role_title: string;
            short_description: string;
            detail_description: string;
            skills_json: unknown;
            price_label: string;
            rating: string;
            reviews_count: string;
            accent: string;
            portfolio_json?: string | null;
          },
        ),
      );
    } catch (innerErr) {
      console.error("[api/job-seekers] registered query:", innerErr);
      try {
        const [regRows] = await db.query<RowDataPacket[]>(
          `SELECT fp.user_id, u.full_name, fp.role_title, fp.short_description, fp.detail_description,
                  fp.skills_json, fp.price_label, fp.rating, fp.reviews_count, fp.accent,
                  '[]' AS portfolio_json
           FROM freelancer_profiles fp
           INNER JOIN users u ON u.id = fp.user_id
           WHERE fp.is_active = 1 AND u.role = 'freelancer'
           ORDER BY fp.updated_at DESC
           LIMIT 500`,
        );
        registered = regRows.map((r) =>
          mapRegisteredFreelancerRow(
            r as {
              user_id: number;
              full_name: string;
              role_title: string;
              short_description: string;
              detail_description: string;
              skills_json: unknown;
              price_label: string;
              rating: string;
              reviews_count: string;
              accent: string;
              portfolio_json?: string | null;
            },
          ),
        );
      } catch (fallbackErr) {
        console.error("[api/job-seekers] fallback query:", fallbackErr);
      }
    }

    return NextResponse.json(
      { jobSeekers: registered },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[api/job-seekers]", error);
    const message = jobSeekersErrorMessage(error);
    return NextResponse.json(
      { jobSeekers: [] as JobSeekerPublic[], error: message },
      { status: 200 },
    );
  }
}
