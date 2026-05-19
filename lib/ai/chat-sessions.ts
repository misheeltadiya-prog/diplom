import type { AiPromptAnalysis, AiSearchTarget } from "./types";

/** AI Job Match — чат түүх (localStorage) */
export const AI_MATCH_SESSIONS_KEY = "cwork-ai-match-sessions-v2";
export const AI_MATCH_ACTIVE_SESSION_KEY = "cwork-ai-match-active-session-v2";
export const AI_MATCH_MAX_SESSIONS = 28;

export type StoredJobRow = {
  job: {
    id: string;
    title: string;
    description: string;
    companyName: string;
    location: string;
    employmentType: string;
    salary: string;
    createdAt: string | null;
  };
  derived: { category: string; level: string; workType: string };
  match: {
    score: number;
    percentage: number;
    matchedSkills: string[];
    breakdown: {
      titleSkillHits: number;
      descriptionSkillHits: number;
      categoryMatch: boolean;
      levelMatch: boolean;
      workTypeMatch: boolean;
    };
  };
  confidenceLabel: string;
};

export type StoredFreelancerRow = {
  freelancer: {
    id: number;
    fullName: string;
    roleTitle: string;
    shortDescription: string;
    skills: string[];
    priceLabel: string;
    rating: string;
    avatarUrl: string | null;
    linkedUserId: number | null;
  };
  match: {
    score: number;
    percentage: number;
    matchedSkills: string[];
    breakdown: { titleHits: number; skillHits: number };
  };
  confidenceLabel: string;
};

export type ChatTurn = {
  prompt: string;
  analysis: AiPromptAnalysis | null;
  jobs: StoredJobRow[];
  freelancers?: StoredFreelancerRow[];
  searchTarget?: AiSearchTarget;
  error: string | null;
  info: string | null;
};

export type ChatSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  turns: ChatTurn[];
};

function isChatTurn(x: unknown): x is ChatTurn {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.prompt !== "string") return false;
  if (o.analysis !== null && o.analysis !== undefined) {
    if (typeof o.analysis !== "object" || !o.analysis) return false;
    const a = o.analysis as Record<string, unknown>;
    if (!Array.isArray(a.skills)) return false;
  }
  if (!Array.isArray(o.jobs)) return false;
  if (o.error !== null && o.error !== undefined && typeof o.error !== "string") return false;
  if (o.info !== null && o.info !== undefined && typeof o.info !== "string") return false;
  return true;
}

function isSession(x: unknown): x is ChatSession {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.title !== "string") return false;
  if (typeof o.createdAt !== "number" || typeof o.updatedAt !== "number") return false;
  if (!Array.isArray(o.turns)) return false;
  return o.turns.every(isChatTurn);
}

export function sessionTitleFromPrompt(prompt: string): string {
  const t = prompt.trim().replace(/\s+/g, " ");
  if (!t) return "Шинэ чат";
  return t.length <= 52 ? t : `${t.slice(0, 52)}…`;
}

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AI_MATCH_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSession).slice(0, AI_MATCH_MAX_SESSIONS);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_MATCH_SESSIONS_KEY, JSON.stringify(sessions.slice(0, AI_MATCH_MAX_SESSIONS)));
}

export function loadActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(AI_MATCH_ACTIVE_SESSION_KEY);
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function saveActiveSessionId(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) localStorage.removeItem(AI_MATCH_ACTIVE_SESSION_KEY);
  else localStorage.setItem(AI_MATCH_ACTIVE_SESSION_KEY, id);
}

export function createEmptySession(): ChatSession {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();
  return { id, createdAt: now, updatedAt: now, title: "Шинэ чат", turns: [] };
}

export function upsertSessionTurn(
  sessions: ChatSession[],
  sessionId: string,
  turn: ChatTurn,
): ChatSession[] {
  const now = Date.now();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) {
    const s: ChatSession = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      title: sessionTitleFromPrompt(turn.prompt),
      turns: [turn],
    };
    return [s, ...sessions].slice(0, AI_MATCH_MAX_SESSIONS);
  }
  const prev = sessions[idx]!;
  const newTitle = prev.turns.length === 0 ? sessionTitleFromPrompt(turn.prompt) : prev.title;
  const nextS: ChatSession = {
    ...prev,
    title: newTitle,
    updatedAt: now,
    turns: [...prev.turns, turn],
  };
  const rest = sessions.filter((_, i) => i !== idx);
  return [nextS, ...rest].slice(0, AI_MATCH_MAX_SESSIONS);
}
