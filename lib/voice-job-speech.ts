import {
  getSectionsForJobDetail,
  type JobFieldsForDescription,
} from "@/lib/job-description-sections";
import type { ParsedJobDescriptionSection } from "@/lib/job-description-sections";

function cleanSpeechText(value: string) {
  return value
    .replace(/[<>*_#`~|【】]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateSpeech(text: string, maxLen: number) {
  const t = cleanSpeechText(text);
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const dot = cut.lastIndexOf(".");
  if (dot > Math.floor(maxLen * 0.45)) return cut.slice(0, dot + 1);
  return `${cut.trim()}…`;
}

function findSection(
  sections: ParsedJobDescriptionSection[],
  hints: string[],
): ParsedJobDescriptionSection | undefined {
  return sections.find((s) => {
    const h = s.heading.toLowerCase();
    return hints.some((k) => h.includes(k));
  });
}

function sectionSpeech(
  sections: ParsedJobDescriptionSection[],
  hints: string[],
  labelMn: string,
  maxLen: number,
): string {
  const sec = findSection(sections, hints);
  const body = sec?.body?.trim();
  if (!body) return "";
  return `${labelMn}. ${truncateSpeech(body, maxLen)}`;
}

export type JobVoiceSpeechInput = JobFieldsForDescription & {
  categoryName?: string;
};

/**
 * Монгол уншлага: компани, албан тушаал, гол мэдээлэл, үүрэг, шаардлага.
 * brief=true → товч; false → «дахин унш» үед ур чадвар хүртэл.
 */
export function buildJobVoiceSpeechMn(
  job: JobVoiceSpeechInput,
  index: number,
  total: number,
  brief = true,
): string {
  const sections = getSectionsForJobDetail(job);
  const parts: string[] = [
    `Ажлын зар ${index + 1}, нийт ${total}.`,
    `Компани: ${job.companyName}.`,
    `Албан тушаал: ${job.title}.`,
    `Байршил: ${job.location}.`,
    `Ажлын төрөл: ${job.employmentType}.`,
    `Цалин: ${job.salary}.`,
  ];

  if (job.categoryName?.trim()) {
    parts.push(`Ангилал: ${job.categoryName.trim()}.`);
  }

  parts.push(
    sectionSpeech(sections, ["үрэг", "үйлчилгээ"], "Хийж гүйцэтгэх үүрэг", brief ? 280 : 520),
  );
  parts.push(
    sectionSpeech(sections, ["шаардлага", "тавигдах"], "Тавигдах шаардлага", brief ? 240 : 480),
  );

  if (!brief) {
    parts.push(
      sectionSpeech(sections, ["ур чадвар", "чадвар"], "Шаардлагатай ур чадвар", 400),
    );
    parts.push(
      sectionSpeech(sections, ["нэмэлт"], "Нэмэлт мэдээлэл", 220),
    );
  }

  return cleanSpeechText(parts.filter(Boolean).join(" ")).slice(0, brief ? 1400 : 3200);
}
