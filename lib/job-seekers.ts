import type { RowDataPacket } from "mysql2";

export type AccentKey = "lime" | "mint" | "pink" | "gold";
export type BadgeToneKey = "top" | "new" | "hot";

export type JobSeekerPublic = {
  id: number;
  initials: string;
  fullName: string;
  roleTitle: string;
  shortDescription: string;
  detailDescription: string;
  skills: string[];
  priceLabel: string;
  starsLabel: string;
  rating: string;
  reviewsCount: string;
  accent: AccentKey;
  badgeLabel: string | null;
  badgeTone: BadgeToneKey | null;
};

export type JobSeekerRow = RowDataPacket & {
  id: number;
  initials: string;
  full_name: string;
  role_title: string;
  short_description: string;
  detail_description: string;
  skills_json: unknown;
  price_label: string;
  stars_label: string;
  rating: string;
  reviews_count: string;
  accent: string;
  badge_label: string | null;
  badge_tone: string | null;
};

function parseSkills(raw: unknown): string[] {
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(raw)) {
    try {
      const parsed = JSON.parse((raw as Buffer).toString("utf8")) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.filter((s): s is string => typeof s === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function isAccent(v: string): v is AccentKey {
  return v === "lime" || v === "mint" || v === "pink" || v === "gold";
}

function normalizeBadgeTone(v: string | null): BadgeToneKey | null {
  if (v === null) {
    return null;
  }
  if (v === "top" || v === "new" || v === "hot") {
    return v;
  }
  return null;
}

export function mapJobSeekerRow(row: JobSeekerRow): JobSeekerPublic {
  const accentRaw = String(row.accent ?? "lime");
  const accent = isAccent(accentRaw) ? accentRaw : "lime";
  const badgeTone = normalizeBadgeTone(row.badge_tone);
  return {
    id: Number(row.id),
    initials: String(row.initials ?? ""),
    fullName: String(row.full_name ?? ""),
    roleTitle: String(row.role_title ?? ""),
    shortDescription: String(row.short_description ?? ""),
    detailDescription: String(row.detail_description ?? ""),
    skills: parseSkills(row.skills_json),
    priceLabel: String(row.price_label ?? ""),
    starsLabel: String(row.stars_label ?? "★★★★★"),
    rating: String(row.rating ?? ""),
    reviewsCount: String(row.reviews_count ?? ""),
    accent,
    badgeLabel: row.badge_label == null ? null : String(row.badge_label),
    badgeTone,
  };
}
