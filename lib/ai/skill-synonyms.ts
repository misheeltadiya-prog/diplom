/**
 * AI-ээс ирсэн ур чадварын нэр → зарын гарчиг/тайлбарт хайх үгийн хувилбарууд (Монгол + English).
 * "Teaching" гэж ирсэн ч зар дээр зөвхөн "багш" гэж байвал тааруулна.
 */
const DOMAIN_SYNONYMS: Record<string, string[]> = {
  teaching: ["багш", "багшийн", "багшлах", "teacher", "educator", "tutor", "education", "сургууль", "боловсрол", "хичээл", "сургалт", "заах", "заагч"],
  teacher: ["багш", "багшийн", "teacher", "teaching", "education", "заах"],
  education: ["боловсрол", "сургууль", "багш", "education", "teaching", "сургалт", "хичээл"],
  mathematics: ["математик", "математикийн", "math", "algebra", "geometry"],
  mongolian: ["монгол хэл", "монгол", "mongolian", "language arts"],
  translator: ["орчуулагч", "орчуулга", "translator", "translation", "interpreter"],
  accountant: ["бухгалтер", "санхүү", "accountant", "accounting", "finance officer"],
  sales: ["борлуулалт", "sales", "бизнес хөгжүүлэлт", "худалдаа"],
  driver: ["жолооч", "driver", "тээвэр", "авто"],
  nurse: ["сувилагч", "nurse", "эмнэлэг", "healthcare"],
  marketing: ["маркетинг", "marketing", "seo", "social media", "контент"],
  design: ["дизайн", "design", "figma", "ui", "ux"],
};

/** Нэг ур чадварын нэрээр тааруулах бүх хувилбар */
export function skillMatchPhrases(skill: string): string[] {
  const raw = skill.trim();
  if (!raw) return [];
  const key = raw.toLowerCase();
  const set = new Set<string>([raw, key]);

  for (const [k, list] of Object.entries(DOMAIN_SYNONYMS)) {
    if (key === k || key.includes(k) || k.includes(key)) {
      list.forEach((x) => set.add(x.toLowerCase()));
    }
  }
  if (/багш|teacher|education|боловсрол|сургууль|заах|хичээл/.test(key)) {
    DOMAIN_SYNONYMS.teaching.forEach((x) => set.add(x.toLowerCase()));
  }
  return [...set].filter(Boolean);
}

export function userAskedEducationFocus(skills: string[], category: string): boolean {
  const c = category.trim().toLowerCase();
  if (c === "education") return true;
  const blob = `${skills.join(" ")}`.toLowerCase();
  return /багш|боловсрол|сургууль|teacher|teaching|education|tutor|хичээл|заах|сургалт/.test(blob);
}
