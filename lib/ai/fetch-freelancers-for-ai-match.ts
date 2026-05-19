import type { RowDataPacket } from "mysql2";
import { getDb } from "@/lib/db";
import { mapRegisteredFreelancerRow } from "@/lib/job-seekers";
import type { MatchableFreelancer } from "./types";

export async function fetchFreelancersForAiMatch(): Promise<MatchableFreelancer[]> {
  try {
    const db = getDb();
    const [regRows] = await db.query<RowDataPacket[]>(
      `SELECT fp.user_id, u.full_name, IFNULL(u.avatar_url, '') AS avatar_url, fp.role_title, fp.short_description, fp.detail_description,
              fp.skills_json, fp.price_label, fp.stars_label, fp.rating, fp.reviews_count, fp.accent,
              fp.badge_label, fp.badge_tone,
              IFNULL(fp.portfolio_json, '[]') AS portfolio_json
       FROM freelancer_profiles fp
       INNER JOIN users u ON u.id = fp.user_id
       WHERE fp.is_active = 1 AND u.role = 'freelancer'
       ORDER BY fp.updated_at DESC
       LIMIT 300`,
    );

    return regRows.map((r) => {
      const mapped = mapRegisteredFreelancerRow(
        r as {
          user_id: number;
          full_name: string;
          avatar_url?: string | null;
          role_title: string;
          short_description: string;
          detail_description: string;
          skills_json: unknown;
          price_label: string;
          stars_label?: string;
          rating: string;
          reviews_count: string;
          accent: string;
          badge_label?: string | null;
          badge_tone?: string | null;
          portfolio_json?: string | null;
        },
      );
      return {
        id: mapped.id,
        fullName: mapped.fullName,
        roleTitle: mapped.roleTitle,
        shortDescription: mapped.shortDescription,
        detailDescription: mapped.detailDescription,
        skills: mapped.skills,
        priceLabel: mapped.priceLabel,
        rating: mapped.rating,
        avatarUrl: mapped.avatarUrl ?? null,
        linkedUserId: mapped.linkedUserId ?? null,
      };
    });
  } catch {
    return [];
  }
}
