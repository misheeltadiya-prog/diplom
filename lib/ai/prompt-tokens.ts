import type { AiPromptAnalysis } from "./types";
import { normalizeToken } from "./job-profile";

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "i",
  "me",
  "my",
  "we",
  "our",
  "би",
  "та",
  "гэж",
  "эсвэл",
  "байна",
  "байх",
  "байгаа",
  "хайж",
  "хайна",
  "хүсэж",
  "дээр",
  "тухай",
  "юм",
  "нэг",
  "энэ",
  "тэр",
  "ажил",
  "ажлын",
  "зар",
  "санал",
  "хүснэ",
  "хүсэлтэй",
  "хайдаг",
  "хайжбайна",
  "looking",
  "need",
  "want",
  "with",
  "from",
  "who",
  "that",
  "this",
  "will",
  "can",
  "have",
  "has",
  "also",
  "just",
  "very",
  "some",
  "any",
]);

const SHORT_OK = new Set(["js", "ts", "go", "ai", "ui", "ux", "db", "it", "qa", "pm"]);

/**
 * Хэрэглэгчийн бичсэн текстээс гарчигтай тааруулах түлхүүр үг (Gemini алдсан ч "react remote" гэх мэт).
 */
export function promptTokensForTitleMatch(raw: string): string[] {
  const parts = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}#.+\s-]/gu, " ")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeToken(p);
    if (!n || STOP.has(n)) continue;
    if (n.length < 2) continue;
    if (n.length === 2 && !SHORT_OK.has(n)) continue;
    out.push(p);
  }
  return [...new Set(out)].slice(0, 22);
}

/** Гарчиг + тайлбарт хайх бүх хэллэг (үг + хоёр үгийн хослол). */
export function promptSearchPhrases(raw: string): string[] {
  const tokens = promptTokensForTitleMatch(raw);
  const set = new Set<string>(tokens);
  const lower = raw.toLowerCase().replace(/[^\p{L}\p{N}\s#.+-]/gu, " ");
  const words = lower.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  for (let i = 0; i < words.length - 1; i++) {
    const a = normalizeToken(words[i]!);
    const b = normalizeToken(words[i + 1]!);
    if (!a || !b || STOP.has(a) || STOP.has(b)) continue;
    set.add(`${words[i]} ${words[i + 1]}`);
    if (set.size >= 28) break;
  }
  const compact = lower.replace(/\s+/g, " ").trim();
  if (compact.length >= 4 && compact.length <= 48) set.add(compact);
  return [...set].filter(Boolean).slice(0, 28);
}

/** Gemini skills + prompt-оос гарсан нэмэлт түлхүүр (давхардахгүй) */
export function mergePromptKeywordsIntoAnalysis(ai: AiPromptAnalysis, prompt: string): AiPromptAnalysis {
  const tokens = promptTokensForTitleMatch(prompt);
  const seen = new Set(ai.skills.map((s) => normalizeToken(s.trim())));
  const merged = [...ai.skills];
  for (const t of tokens) {
    const n = normalizeToken(t);
    if (!n || seen.has(n)) continue;
    merged.push(t);
    seen.add(n);
    if (merged.length >= 14) break;
  }
  return { ...ai, skills: merged };
}
