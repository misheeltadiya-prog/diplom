import type { JobSeekerPublic } from "@/lib/job-seekers";

/** Ангиллын select (англи) ↔ профайлын текст (монгол/англи холимог) */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Developer: [
    "developer",
    "dev",
    "full-stack",
    "fullstack",
    "backend",
    "frontend",
    "node",
    "react",
    "next",
    "typescript",
    "web",
    "engineer",
    "programmer",
    "хөгжүүл",
    "програм",
    "вэб",
    "nestjs",
    "php",
    "java",
    "python",
    "sql",
    "wordpress",
  ],
  Designer: ["design", "ui", "ux", "figma", "designer", "дизайн", "брэнд", "график", "illustrator", "photoshop"],
  Mobile: ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin", "мобайл", "апп", "expo"],
  Marketing: ["marketing", "seo", "ads", "маркетинг", "digital", "smm", "facebook", "google ads", "контент", "copy"],
};

export function haystackForFilter(item: JobSeekerPublic): string {
  return [item.fullName, item.roleTitle, item.shortDescription, item.detailDescription, ...item.skills]
    .join(" ")
    .toLowerCase();
}

export function matchesCategory(item: JobSeekerPublic, category: string): boolean {
  if (category === "Бүгд") return true;
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords?.length) return true;
  const hay = haystackForFilter(item);
  return keywords.some((kw) => hay.includes(kw.toLowerCase()));
}

/** DB-аас ирсэн жагсаалтыг сервер дээр шүүх (хайлт + ангилал) */
export function filterJobSeekersPublic(items: JobSeekerPublic[], filters: { q: string; category: string }): JobSeekerPublic[] {
  const q = filters.q.trim().toLowerCase();
  return items.filter((item) => {
    if (!matchesCategory(item, filters.category)) return false;
    if (!q) return true;
    return haystackForFilter(item).includes(q);
  });
}
