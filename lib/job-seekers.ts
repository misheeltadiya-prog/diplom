import type { RowDataPacket } from "mysql2";

/** Жагсаалтын картын ID — `users.id`-аас ялгах (чат/API). */
export const REGISTERED_FREELANCER_SEEKER_ID_OFFSET = 9_000_000;

export function registeredSeekerCardIdToUserId(cardId: number): number | null {
  if (cardId < REGISTERED_FREELANCER_SEEKER_ID_OFFSET) return null;
  const uid = cardId - REGISTERED_FREELANCER_SEEKER_ID_OFFSET;
  return uid > 0 ? uid : null;
}

export type AccentKey = "lime" | "mint" | "pink" | "gold";
export type BadgeToneKey = "top" | "new" | "hot";

export type JobSeekerPublic = {
  id: number;
  initials: string;
  fullName: string;
  /** Registered user avatar URL (`users.avatar_url`). */
  avatarUrl?: string | null;
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
  /** Бүртгэлтэй freelancer (users.id) — компани санал илгээхэд */
  linkedUserId?: number | null;
  portfolioItems?: string[];
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
  linked_user_id?: number | null;
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
    linkedUserId: row.linked_user_id == null ? null : Number(row.linked_user_id),
  };
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "CW";
}

function parsePortfolioJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 12);
  } catch {
    return [];
  }
}

/** Бүртгэлтэй freelancer_profiles + users — жагсаалтад нэгтгэх */
export function mapRegisteredFreelancerRow(row: {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  role_title: string;
  short_description: string;
  detail_description: string;
  skills_json: unknown;
  price_label: string;
  rating: string;
  reviews_count: string;
  accent: string;
  portfolio_json?: string | null;
}): JobSeekerPublic {
  const uid = Number(row.user_id);
  const accentRaw = String(row.accent ?? "lime");
  const accent = isAccent(accentRaw) ? accentRaw : "lime";
  const portfolioItems = parsePortfolioJson(row.portfolio_json ?? undefined);
  const avatar = typeof row.avatar_url === "string" ? row.avatar_url.trim() : "";
  return {
    id: REGISTERED_FREELANCER_SEEKER_ID_OFFSET + uid,
    linkedUserId: uid,
    initials: initialsFromName(String(row.full_name ?? "")),
    fullName: String(row.full_name ?? ""),
    avatarUrl: avatar ? avatar : null,
    roleTitle: String(row.role_title ?? ""),
    shortDescription: String(row.short_description ?? ""),
    detailDescription: String(row.detail_description ?? ""),
    skills: parseSkills(row.skills_json),
    priceLabel: String(row.price_label ?? ""),
    starsLabel: "★★★★★",
    rating: String(row.rating ?? "5.0"),
    reviewsCount: String(row.reviews_count ?? "0"),
    accent,
    badgeLabel: "Бүртгэлтэй",
    badgeTone: "new",
    portfolioItems,
  };
}
