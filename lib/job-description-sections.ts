/** Компани зар оруулахад API / DB-д нэг текст болгон хадгалагдана; UI-д эдгээр гарчгаар задарна */
export const STRUCTURED_JOB_SECTION_LABELS = [
  "1. Хийж гүйцэтгэх үүрэг",
  "2. Тавигдах шаардлага",
  "3. Нэмэлт мэдээлэл",
  "4. Шаардлагатай ур чадвар",
  "5. Хангамж, урамшуулал",
  "6. Холбоо барих",
] as const;

export type JobFieldsForDescription = {
  description: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salary: string;
};

export function buildStructuredJobDescription(sections: string[]): string {
  return STRUCTURED_JOB_SECTION_LABELS.map((label, i) => {
    const body = (sections[i] ?? "").trim();
    return `【${label}】\n${body}`;
  }).join("\n\n");
}

export type ParsedJobDescriptionSection = {
  heading: string;
  body: string;
};

/** Хадгалсан текст нь 【гэрчилгээ】 хэлбэртэй бол хэсэг болгон задлана */
export function parseStructuredJobDescription(raw: string): ParsedJobDescriptionSection[] | null {
  const s = raw.trim();
  if (!s.startsWith("【")) {
    return null;
  }

  const blocks = s.split(/\n\n(?=【)/);
  const out: ParsedJobDescriptionSection[] = [];

  for (const block of blocks) {
    const m = block.match(/^【([^】]+)】\s*\n?([\s\S]*)$/);
    if (!m) {
      return null;
    }
    out.push({ heading: m[1].trim(), body: m[2].trim() });
  }

  return out.length > 0 ? out : null;
}

/** Хуучин энгийн тайлбар эсвэл хоосон үед жишээ 6 хэсгийн агуулга */
export function syntheticSectionBodiesForJob(job: JobFieldsForDescription): string[] {
  const legacy = job.description.trim();
  const hasStructured = legacy.startsWith("【");
  const sec1 =
    !hasStructured && legacy.length > 0
      ? legacy
      : hasStructured
        ? ""
        : `«${job.title}» албан тушаалын хүрээнд үндсэн даалгавар, өдөр тутмын гүйцэтгэлийг тодорхойлно. Үүрэг даалгавар, үр дүнтэй холбоотой ажлыг гүйцэтгэнэ.`;

  if (hasStructured) {
    return Array.from({ length: 6 }, () => "");
  }

  return [
    sec1,
    `Тавигдах шаардлага: ${job.companyName}-д тохирох боловсрол, мэргэжлийн түвшин; холбогдох чиглэлээр сурсан, холбогдох ажлын туршлагад давуу эрх өгнө. Жишээ: тодорхой сургууль, салбарт ажилласан туршлага.`,
    `Нэмэлт мэдээлэл: албан байршил ${job.location}, ажлын төрөл ${job.employmentType}. Ажлын цаг, ээлж, оффис / remote нөхцлийг компаниас тодруулна.`,
    `Шаардлагатай ур чадвар: энэ албан тушаалд шаардлагатай техникийн ур чадвар, хэл, хэрэгсэл; мөн хамтын ажиллагаа, харилцааны чадвар.`,
    `Хангамж, урамшуулал: жишээ нь хоолны мөнгө (12 000 ₮), унааны мөнгө (8 000 ₮) гэх мэт; сургалт, эрүүл мэндийн даатгал зэргийг компанийн бодлогоос.`,
    `Холбоо барих: ${job.companyName} — өргөдөл илгээсний дараа HR эсвэл зар оруулагчтай холбогдоно. Холбоо барих мэдээллийг зарын сурталчилгаанаас үзнэ үү.`,
  ];
}

/**
 * Дэлгэрэнгүй цонхонд үргүйд 6 хэсэг (DB-д 6 【】 байвал яг тэр гарчигтай).
 */
export function getSectionsForJobDetail(job: JobFieldsForDescription): ParsedJobDescriptionSection[] {
  const parsed = parseStructuredJobDescription(job.description);
  if (parsed && parsed.length === 6) {
    return parsed;
  }
  if (parsed && parsed.length > 0 && parsed.length < 6) {
    const synth = syntheticSectionBodiesForJob({ ...job, description: "" });
    return STRUCTURED_JOB_SECTION_LABELS.map((heading, i) => ({
      heading,
      body: (parsed[i]?.body?.trim() || synth[i] || "").trim(),
    }));
  }
  const bodies = syntheticSectionBodiesForJob(job);
  return STRUCTURED_JOB_SECTION_LABELS.map((heading, i) => ({
    heading,
    body: bodies[i] ?? "",
  }));
}

/** Карт — эхний хэсгийн товч */
export function jobCardPreviewFromJob(job: JobFieldsForDescription, maxLen = 160): string {
  const text = (getSectionsForJobDetail(job)[0]?.body ?? job.description).trim();
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen).trim()}…`;
}

/** @deprecated шинэ картууд jobCardPreviewFromJob ашиглана */
export function jobDescriptionCardPreview(raw: string, maxLen = 160): string {
  const sections = parseStructuredJobDescription(raw);
  const text = (sections?.[0]?.body ?? raw).trim();
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen).trim()}…`;
}
