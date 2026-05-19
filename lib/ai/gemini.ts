import { GoogleGenerativeAI, SchemaType, type GenerationConfig } from "@google/generative-ai";
import type { AiPromptAnalysis } from "./types";

const SYSTEM_INSTRUCTION = `You are an expert hiring assistant for a freelance / job marketplace (C-Work style).
The user may write in Mongolian, English, or mixed language.

Your ONLY task is to read the user's natural-language request and output a single JSON object with these keys:
- "skills": array of concise skill or role names. Max 14 items. Include BOTH cases when present:
  (A) JOB TITLE they want — e.g. "багшийн туслах", "React developer", "бухгалтер" (keep Mongolian job names verbatim).
  (B) THEIR OWN skills — when they describe what they know ("би React, TypeScript мэддэг", "my skills are UI design", "ур чадвар: python") extract every skill/tool they mention so matching can find jobs that need those skills.
  CRITICAL: skills MUST match the user's intent. Teacher / багш → Teaching, Education, багш — NOT random tech unless they asked for IT.
  If they ask for developer / программист jobs, include programming skills they mention or imply.
- "category": one of: "frontend", "backend", "mobile", "design", "data", "devops", "qa", "management", "education", "other", "" (empty only if truly unclear).
  Use "education" for teaching, school, tutoring, curriculum, багш, сургууль, боловсрол-related roles.
- "level": one of: "junior", "mid", "senior", "lead", "" (empty if not stated or unclear).
- "workType": one of: "remote", "fulltime", "parttime", "freelance", "hybrid", "" (empty if unclear).

Infer reasonable values from context. If the user is a student or fresh graduate, prefer level "junior".
If they mention remote / ажилдаа очиж / оффис, map accordingly (remote vs hybrid vs fulltime office as fulltime + not remote — use "fulltime" and empty workType if ambiguous).

Input length: the user may send ONLY a few keywords (no full sentence required). Examples: "react remote", "багшийн туслах", "би javascript мэддэг ажил хайна", "frontend mongolia". Treat keywords and full sentences the same: extract job-title words AND self-skill words into "skills".

Return ONLY valid JSON matching the schema — no markdown, no commentary.`;

function normalizeAnalysis(raw: unknown): AiPromptAnalysis {
  const empty: AiPromptAnalysis = { skills: [], category: "", level: "", workType: "" };
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  const skillsRaw = o.skills;
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw.map((s) => String(s).trim()).filter(Boolean).slice(0, 16)
    : [];
  return {
    skills,
    category: typeof o.category === "string" ? o.category.trim().toLowerCase() : "",
    level: typeof o.level === "string" ? o.level.trim().toLowerCase() : "",
    workType: typeof o.workType === "string" ? o.workType.trim().toLowerCase() : "",
  };
}

function parseJsonFromModelText(text: string): AiPromptAnalysis {
  const t = text.trim();
  if (!t) return normalizeAnalysis(null);
  try {
    return normalizeAnalysis(JSON.parse(t) as unknown);
  } catch {
    const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    if (fence?.[1]) {
      try {
        return normalizeAnalysis(JSON.parse(fence[1].trim()) as unknown);
      } catch {
        /* fall through */
      }
    }
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return normalizeAnalysis(JSON.parse(t.slice(start, end + 1)) as unknown);
      } catch {
        /* fall through */
      }
    }
    return normalizeAnalysis(null);
  }
}

function formatGeminiError(err: unknown): string {
  if (err instanceof Error) {
    const any = err as Error & { status?: number; statusText?: string; errorDetails?: unknown };
    const parts = [err.message];
    if (typeof any.status === "number") parts.push(`HTTP ${any.status}`);
    if (any.errorDetails) {
      try {
        parts.push(JSON.stringify(any.errorDetails));
      } catch {
        parts.push(String(any.errorDetails));
      }
    }
    if (err.cause instanceof Error) parts.push(err.cause.message);
    return parts.filter(Boolean).join(" — ");
  }
  return String(err);
}

/** `gemini-1.5-flash` суурь нэр ихэнх түлхүүр дээр v1beta-д 404 өгдөг тул `*-latest` эсвэл 2.x руу шилжүүлнэ. */
function normalizeModelId(raw: string): string {
  let id = raw.trim();
  if (id.startsWith("models/")) id = id.slice("models/".length);
  if (id === "gemini-1.5-flash") return "gemini-1.5-flash-latest";
  return id;
}

function geminiFailureHint(formattedMessage: string): string {
  const m = formattedMessage.toLowerCase();
  if (/\b404\b/.test(formattedMessage) || /not found for api version|is not found/i.test(m)) {
    return " — 404 ихэвчлэн буруу/хуучин загварын нэр (түлхүүр хүчингүй гэсэн үг биш). GEMINI_MODEL=gemini-2.0-flash эсвэл gemini-2.5-flash гэж .env.local-д туршина уу.";
  }
  if (
    /\b401\b/.test(formattedMessage) ||
    /\b403\b/.test(formattedMessage) ||
    /api key not valid|invalid api key|permission denied/i.test(m)
  ) {
    return " — Энэ нь ихэвчлэн GEMINI_API_KEY-тай холбоотой (хугацаа дууссан, буруу хуулсан, эсвэл төсөлд хориглосон). https://aistudio.google.com/apikey";
  }
  return "";
}

const JSON_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    category: { type: SchemaType.STRING },
    level: { type: SchemaType.STRING },
    workType: { type: SchemaType.STRING },
  },
  required: ["skills", "category", "level", "workType"],
};

async function generateWithConfig(
  apiKey: string,
  modelId: string,
  prompt: string,
  opts: { useResponseSchema: boolean },
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig = {
    temperature: 0.2,
    responseMimeType: "application/json",
    ...(opts.useResponseSchema ? { responseSchema: JSON_SCHEMA } : {}),
  } as GenerationConfig;

  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig,
  });

  const result = await model.generateContent(prompt.trim());
  const text = result.response.text();
  return text ?? "";
}

/**
 * Fallback: эхлээд 2.0 flash (хамгийн өргөн нээлттэй), дараа нь 2.5, эцэст нь 1.5 *-latest.
 * `gemini-1.5-flash` суурь нэрийг жагсаалтаас хассан (ихэнх тохиолдолд v1beta дээр 404).
 */
const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.5-flash",
  "gemini-1.5-flash-latest",
] as const;

export async function analyzeUserPrompt(prompt: string): Promise<AiPromptAnalysis> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const configuredRaw = process.env.GEMINI_MODEL?.trim();
  const configured = configuredRaw ? normalizeModelId(configuredRaw) : null;
  const candidates = [...(configured ? [configured] : []), ...DEFAULT_MODEL_CANDIDATES];
  const modelIds = [...new Set(candidates.filter(Boolean))];

  let lastErr: unknown;
  for (const modelId of modelIds) {
    for (const useSchema of [true, false]) {
      try {
        const text = await generateWithConfig(key, modelId, prompt, { useResponseSchema: useSchema });
        return parseJsonFromModelText(text);
      } catch (e) {
        lastErr = e;
      }
    }
  }

  const formatted = lastErr ? formatGeminiError(lastErr) : "";
  const hint = formatted ? geminiFailureHint(formatted) : "";
  throw new Error(
    lastErr
      ? `Gemini: ${formatted}${hint} (оролдсон загварууд: ${modelIds.join(", ")}).`
      : "Gemini: хариу аваагүй.",
  );
}
