/** Vercel / .env.local дээрх Gemini түлхүүр — хуулбарын алдааг цэвэрлэнэ */

const KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_API_KEY",
] as const;

function sanitizeSecret(raw: string): string {
  let v = raw.trim();
  if (!v) return "";
  // Нэг мөр — заримдаа URL эсвэл тайлбар хамт хуулсан байдаг
  v = v.split(/\r?\n/)[0]!.trim();
  v = v.replace(/^<|>$/g, "").trim();
  v = v.replace(/^['"]|['"]$/g, "").trim();
  return v;
}

/** Runtime дээр Gemini API түлхүүр (хоосон бол "") */
export function getGeminiApiKey(): string {
  for (const name of KEY_ENV_NAMES) {
    const v = sanitizeSecret(process.env[name] ?? "");
    if (v.length >= 20) return v;
  }
  return "";
}

export function getGeminiModelId(): string {
  const raw = sanitizeSecret(process.env.GEMINI_MODEL ?? "");
  if (!raw) return "";
  let id = raw;
  if (id.startsWith("models/")) id = id.slice("models/".length);
  if (id === "gemini-1.5-flash") return "gemini-1.5-flash-latest";
  return id;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey().length >= 20;
}

/** Health / debug — утгыг илрүүлэхгүй */
export function getGeminiEnvDebug(): {
  configured: boolean;
  keyLength: number;
  model: string;
  source: string | null;
} {
  let source: string | null = null;
  let key = "";
  for (const name of KEY_ENV_NAMES) {
    const v = sanitizeSecret(process.env[name] ?? "");
    if (v.length >= 20) {
      source = name;
      key = v;
      break;
    }
  }
  const model = getGeminiModelId() || "gemini-2.0-flash (default)";
  return {
    configured: key.length >= 20,
    keyLength: key.length,
    model,
    source,
  };
}
